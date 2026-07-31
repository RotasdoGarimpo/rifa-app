import prisma from "@rifa-app/db";
import * as z from "zod";

import { publicProcedure } from "../index";
import { pickRandomTickets, releaseExpired } from "../lib/reservations";
import {
	raffleDetailSchema,
	raffleSlugSchema,
	raffleSummarySchema,
	randomTicketsInputSchema,
} from "../schemas/raffle";

const list = publicProcedure
	.route({ method: "GET", path: "/raffles" })
	.output(z.array(raffleSummarySchema))
	.handler(async () => {
		// Expired holds must not inflate the progress bars on the home page.
		await prisma.$transaction((tx) => releaseExpired(tx));

		const raffles = await prisma.raffle.findMany({
			where: { status: "OPEN" },
			orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
			include: {
				_count: { select: { tickets: { where: { status: { not: "FREE" } } } } },
			},
		});

		return raffles.map(({ _count, ...raffle }) => ({
			slug: raffle.slug,
			title: raffle.title,
			subtitle: raffle.subtitle,
			imageUrl: raffle.imageUrl,
			priceCents: raffle.priceCents,
			totalTickets: raffle.totalTickets,
			drawDate: raffle.drawDate,
			drawChannel: raffle.drawChannel,
			featured: raffle.featured,
			takenCount: _count.tickets,
		}));
	});

const bySlug = publicProcedure
	.route({ method: "GET", path: "/raffles/{slug}" })
	.input(z.object({ slug: raffleSlugSchema }))
	.output(raffleDetailSchema)
	.errors({
		RAFFLE_NOT_FOUND: { status: 404, message: "Rifa não encontrada." },
	})
	.handler(async ({ input, errors }) => {
		const raffle = await prisma.raffle.findUnique({
			where: { slug: input.slug },
		});

		if (!raffle) {
			throw errors.RAFFLE_NOT_FOUND();
		}

		await prisma.$transaction((tx) => releaseExpired(tx, raffle.id));

		const taken = await prisma.ticket.findMany({
			where: { raffleId: raffle.id, status: { not: "FREE" } },
			select: { number: true, status: true },
			orderBy: { number: "asc" },
		});

		return {
			slug: raffle.slug,
			title: raffle.title,
			subtitle: raffle.subtitle,
			imageUrl: raffle.imageUrl,
			priceCents: raffle.priceCents,
			totalTickets: raffle.totalTickets,
			drawDate: raffle.drawDate,
			drawChannel: raffle.drawChannel,
			featured: raffle.featured,
			takenCount: taken.length,
			reserved: taken
				.filter((t) => t.status === "RESERVED")
				.map((t) => t.number),
			paid: taken.filter((t) => t.status === "PAID").map((t) => t.number),
		};
	});

/**
 * Powers the "Combos prontos" packages and the "+N aleatórios" button. Picking
 * happens here rather than in the browser so a client can never claim a number
 * it was not offered.
 */
const randomTickets = publicProcedure
	.route({ method: "POST", path: "/raffles/{slug}/random" })
	.input(randomTicketsInputSchema)
	.output(z.object({ numbers: z.array(z.int().positive()) }))
	.errors({
		RAFFLE_NOT_FOUND: { status: 404, message: "Rifa não encontrada." },
		NOT_ENOUGH_TICKETS: {
			status: 409,
			message: "Não há números livres suficientes.",
		},
	})
	.handler(async ({ input, errors }) => {
		const raffle = await prisma.raffle.findUnique({
			where: { slug: input.slug },
			select: { id: true, status: true },
		});

		if (!raffle) {
			throw errors.RAFFLE_NOT_FOUND();
		}

		await prisma.$transaction((tx) => releaseExpired(tx, raffle.id));

		const numbers = await pickRandomTickets(raffle.id, input.count);

		if (numbers.length < input.count) {
			throw errors.NOT_ENOUGH_TICKETS();
		}

		return { numbers };
	});

export const raffleRouter = { list, bySlug, randomTickets };
