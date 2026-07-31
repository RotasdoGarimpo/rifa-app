import prisma from "@rifa-app/db";
import { env } from "@rifa-app/env/server";
import * as z from "zod";

import { protectedProcedure } from "../index";
import {
	buildChargeMessage,
	padNumber,
	slugify,
	whatsappLink,
} from "../lib/format";
import { createRaffle, releaseExpired } from "../lib/reservations";

const STATUSES = ["PENDING", "PAID", "EXPIRED", "CANCELLED"] as const;

const reservationInclude = {
	tickets: { select: { number: true }, orderBy: { number: "asc" } },
	raffle: {
		select: { slug: true, title: true, priceCents: true, totalTickets: true },
	},
} as const;

const adminReservationSchema = z.object({
	code: z.string(),
	sequence: z.int(),
	name: z.string(),
	phone: z.string(),
	status: z.enum(STATUSES),
	numbers: z.array(z.int().positive()),
	totalCents: z.int().nonnegative(),
	createdAt: z.date(),
	raffleTitle: z.string(),
	raffleTotalTickets: z.int().positive(),
	/** Pre-built so the organizer taps one link to chase payment. */
	chargeHref: z.url(),
});

type ReservationRow = {
	code: string;
	sequence: number;
	name: string;
	phone: string;
	status: (typeof STATUSES)[number];
	createdAt: Date;
	tickets: Array<{ number: number }>;
	raffle: {
		slug: string;
		title: string;
		priceCents: number;
		totalTickets: number;
	};
};

function toAdminView(row: ReservationRow) {
	const numbers = row.tickets.map((ticket) => ticket.number);
	const message = buildChargeMessage({
		raffle: row.raffle,
		code: row.code,
		name: row.name,
		phone: row.phone,
		numbers,
		pixKey: env.PIX_KEY,
	});

	return {
		code: row.code,
		sequence: row.sequence,
		name: row.name,
		phone: row.phone,
		status: row.status,
		numbers,
		totalCents: numbers.length * row.raffle.priceCents,
		createdAt: row.createdAt,
		raffleTitle: row.raffle.title,
		raffleTotalTickets: row.raffle.totalTickets,
		chargeHref: whatsappLink(message, row.phone),
	};
}

const listReservations = protectedProcedure
	.route({ method: "GET", path: "/admin/reservations" })
	.input(
		z.object({
			status: z.enum(STATUSES).optional(),
			query: z.string().trim().max(80).optional(),
		}),
	)
	.output(z.array(adminReservationSchema))
	.handler(async ({ input }) => {
		await prisma.$transaction((tx) => releaseExpired(tx));

		const rows = await prisma.reservation.findMany({
			where: input.status ? { status: input.status } : undefined,
			include: reservationInclude,
			orderBy: { sequence: "asc" },
		});

		const needle = input.query?.toLowerCase().replace(/\s+/g, " ").trim();
		if (!needle) return rows.map(toAdminView);

		const digits = needle.replace(/\D/g, "");

		// Searching by number is why this filters in memory rather than in SQL:
		// ticket numbers live on a relation, and the admin list is small enough
		// that a round trip per predicate is not worth the query complexity.
		return rows
			.filter(
				(row) =>
					row.name.toLowerCase().includes(needle) ||
					(digits.length > 0 && row.phone.includes(digits)) ||
					row.code.toLowerCase().includes(needle) ||
					row.tickets.some((ticket) => String(ticket.number) === digits),
			)
			.map(toAdminView);
	});

const stats = protectedProcedure
	.route({ method: "GET", path: "/admin/stats" })
	.output(
		z.object({
			collectedCents: z.int().nonnegative(),
			paidCount: z.int().nonnegative(),
			pendingCents: z.int().nonnegative(),
			pendingCount: z.int().nonnegative(),
			ticketsInPlay: z.int().nonnegative(),
			raffleCount: z.int().nonnegative(),
		}),
	)
	.handler(async () => {
		await prisma.$transaction((tx) => releaseExpired(tx));

		const [rows, raffleCount] = await Promise.all([
			prisma.reservation.findMany({
				where: { status: { in: ["PENDING", "PAID"] } },
				select: {
					status: true,
					_count: { select: { tickets: true } },
					raffle: { select: { priceCents: true } },
				},
			}),
			prisma.raffle.count({ where: { status: "OPEN" } }),
		]);

		let collectedCents = 0;
		let paidCount = 0;
		let pendingCents = 0;
		let pendingCount = 0;
		let ticketsInPlay = 0;

		for (const row of rows) {
			const total = row._count.tickets * row.raffle.priceCents;
			ticketsInPlay += row._count.tickets;

			if (row.status === "PAID") {
				collectedCents += total;
				paidCount += 1;
			} else {
				pendingCents += total;
				pendingCount += 1;
			}
		}

		return {
			collectedCents,
			paidCount,
			pendingCents,
			pendingCount,
			ticketsInPlay,
			raffleCount,
		};
	});

const markPaid = protectedProcedure
	.route({ method: "POST", path: "/admin/reservations/{code}/paid" })
	.input(z.object({ code: z.string() }))
	.output(z.object({ ok: z.literal(true) }))
	.errors({
		RESERVATION_NOT_FOUND: { status: 404, message: "Reserva não encontrada." },
	})
	.handler(async ({ input, errors }) => {
		const reservation = await prisma.reservation.findUnique({
			where: { code: input.code },
			select: { id: true },
		});

		if (!reservation) throw errors.RESERVATION_NOT_FOUND();

		// Reservation and its tickets flip together or not at all.
		await prisma.$transaction([
			prisma.reservation.update({
				where: { id: reservation.id },
				data: { status: "PAID", paidAt: new Date() },
			}),
			prisma.ticket.updateMany({
				where: { reservationId: reservation.id },
				data: { status: "PAID" },
			}),
		]);

		return { ok: true as const };
	});

const cancel = protectedProcedure
	.route({ method: "POST", path: "/admin/reservations/{code}/cancel" })
	.input(z.object({ code: z.string() }))
	.output(z.object({ ok: z.literal(true) }))
	.errors({
		RESERVATION_NOT_FOUND: { status: 404, message: "Reserva não encontrada." },
	})
	.handler(async ({ input, errors }) => {
		const reservation = await prisma.reservation.findUnique({
			where: { code: input.code },
			select: { id: true },
		});

		if (!reservation) throw errors.RESERVATION_NOT_FOUND();

		// Cancelling returns the numbers to the pool.
		await prisma.$transaction([
			prisma.ticket.updateMany({
				where: { reservationId: reservation.id },
				data: { status: "FREE", reservationId: null },
			}),
			prisma.reservation.update({
				where: { id: reservation.id },
				data: { status: "CANCELLED" },
			}),
		]);

		return { ok: true as const };
	});

const exportCsv = protectedProcedure
	.route({ method: "GET", path: "/admin/reservations/export" })
	.output(z.object({ filename: z.string(), csv: z.string() }))
	.handler(async () => {
		const rows = await prisma.reservation.findMany({
			include: reservationInclude,
			orderBy: { sequence: "asc" },
		});

		const header = [
			"ordem",
			"codigo",
			"nome",
			"whatsapp",
			"rifa",
			"numeros",
			"total",
			"status",
			"criada_em",
		];

		const escape = (value: string | number) =>
			`"${String(value).replace(/"/g, '""')}"`;

		const lines = [header.map(escape).join(",")];
		for (const row of rows) {
			lines.push(
				[
					row.sequence,
					row.code,
					row.name,
					row.phone,
					row.raffle.title,
					row.tickets
						.map((t) => padNumber(t.number, row.raffle.totalTickets))
						.join(" "),
					(row.tickets.length * row.raffle.priceCents) / 100,
					row.status,
					row.createdAt.toISOString(),
				]
					.map(escape)
					.join(","),
			);
		}

		return { filename: "reservas.csv", csv: lines.join("\n") };
	});

const createRaffleProcedure = protectedProcedure
	.route({ method: "POST", path: "/admin/raffles" })
	.input(
		z.object({
			title: z.string().trim().min(3).max(80),
			subtitle: z.string().trim().max(120).optional(),
			imageUrl: z.url().optional(),
			priceCents: z.int().positive().max(1_000_000),
			totalTickets: z.int().min(10).max(10_000),
			drawDate: z.iso.date().optional(),
		}),
	)
	.output(z.object({ slug: z.string() }))
	.errors({
		SLUG_TAKEN: { status: 409, message: "Já existe uma rifa com esse nome." },
	})
	.handler(async ({ input, errors }) => {
		const slug = slugify(input.title);

		if (
			await prisma.raffle.findUnique({ where: { slug }, select: { id: true } })
		) {
			throw errors.SLUG_TAKEN();
		}

		const raffle = await createRaffle({
			slug,
			title: input.title,
			subtitle: input.subtitle ?? null,
			imageUrl: input.imageUrl ?? null,
			priceCents: input.priceCents,
			totalTickets: input.totalTickets,
			drawDate: input.drawDate ? new Date(input.drawDate) : null,
		});

		return { slug: raffle.slug };
	});

export const adminRouter = {
	reservations: listReservations,
	stats,
	markPaid,
	cancel,
	exportCsv,
	createRaffle: createRaffleProcedure,
};
