import prisma from "@rifa-app/db";
import { env } from "@rifa-app/env/server";
import * as z from "zod";

import { publicProcedure } from "../index";
import { buildReservationMessage, whatsappLink } from "../lib/format";
import {
	createReservation,
	RaffleClosedError,
	RaffleNotFoundError,
	TicketsUnavailableError,
} from "../lib/reservations";
import {
	createReservationInputSchema,
	reservationSchema,
} from "../schemas/reservation";

type ReservationRow = {
	code: string;
	name: string;
	phone: string;
	status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
	expiresAt: Date;
	createdAt: Date;
	tickets: Array<{ number: number }>;
	raffle: {
		slug: string;
		title: string;
		imageUrl: string | null;
		priceCents: number;
		totalTickets: number;
		drawDate: Date | null;
		drawChannel: string;
	};
};

/**
 * Compose the buyer-facing view, including the WhatsApp text. Built from the
 * stored row rather than from client input, so the amount in the message is
 * always the amount actually owed.
 */
function toReservationView(row: ReservationRow) {
	const numbers = row.tickets.map((ticket) => ticket.number);
	const message = buildReservationMessage({
		raffle: row.raffle,
		code: row.code,
		name: row.name,
		phone: row.phone,
		numbers,
	});

	return {
		code: row.code,
		name: row.name,
		phone: row.phone,
		status: row.status,
		numbers,
		totalCents: numbers.length * row.raffle.priceCents,
		expiresAt: row.expiresAt,
		createdAt: row.createdAt,
		raffle: row.raffle,
		whatsappMessage: message,
		whatsappHref: whatsappLink(message, env.ADMIN_WHATSAPP),
	};
}

const reservationInclude = {
	tickets: { select: { number: true }, orderBy: { number: "asc" } },
	raffle: {
		select: {
			slug: true,
			title: true,
			imageUrl: true,
			priceCents: true,
			totalTickets: true,
			drawDate: true,
			drawChannel: true,
		},
	},
} as const;

const create = publicProcedure
	.route({ method: "POST", path: "/reservations" })
	.input(createReservationInputSchema)
	.output(reservationSchema)
	.errors({
		RAFFLE_NOT_FOUND: { status: 404, message: "Rifa não encontrada." },
		RAFFLE_CLOSED: {
			status: 409,
			message: "Esta rifa não está mais aberta.",
		},
		TICKETS_UNAVAILABLE: {
			status: 409,
			message: "Alguém garantiu esses números antes de você.",
			data: z.object({ numbers: z.array(z.int().positive()) }),
		},
	})
	.handler(async ({ input, errors }) => {
		try {
			const reservation = await createReservation({
				raffleSlug: input.slug,
				numbers: input.numbers,
				name: input.name,
				phone: input.phone,
			});

			const row = await prisma.reservation.findUniqueOrThrow({
				where: { id: reservation.id },
				include: reservationInclude,
			});

			return toReservationView(row);
		} catch (error) {
			if (error instanceof TicketsUnavailableError) {
				throw errors.TICKETS_UNAVAILABLE({
					data: { numbers: error.numbers },
				});
			}
			if (error instanceof RaffleNotFoundError) {
				throw errors.RAFFLE_NOT_FOUND();
			}
			if (error instanceof RaffleClosedError) {
				throw errors.RAFFLE_CLOSED();
			}
			throw error;
		}
	});

const byCode = publicProcedure
	.route({ method: "GET", path: "/reservations/{code}" })
	.input(z.object({ code: z.string().min(3).max(20) }))
	.output(reservationSchema)
	.errors({
		RESERVATION_NOT_FOUND: { status: 404, message: "Reserva não encontrada." },
	})
	.handler(async ({ input, errors }) => {
		const row = await prisma.reservation.findUnique({
			where: { code: input.code },
			include: reservationInclude,
		});

		if (!row) {
			throw errors.RESERVATION_NOT_FOUND();
		}

		return toReservationView(row);
	});

export const reservationRouter = { create, byCode };
