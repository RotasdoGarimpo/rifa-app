import type { Prisma } from "@rifa-app/db";
import prisma from "@rifa-app/db";

/** How long a PENDING reservation holds its tickets before it is released. */
export const HOLD_HOURS = 24;

/** Reservation codes are shown to buyers, so they start well above zero. */
const CODE_OFFSET = 2000;

type Tx = Prisma.TransactionClient;

export function formatReservationCode(sequence: number) {
	return `RF-${CODE_OFFSET + sequence}`;
}

export class RaffleNotFoundError extends Error {
	constructor(public readonly slug: string) {
		super(`Raffle not found: ${slug}`);
	}
}

export class RaffleClosedError extends Error {
	constructor(public readonly slug: string) {
		super(`Raffle is not open: ${slug}`);
	}
}

/** Thrown when someone else took at least one of the requested numbers first. */
export class TicketsUnavailableError extends Error {
	constructor(public readonly numbers: number[]) {
		super(`Tickets no longer available: ${numbers.join(", ")}`);
	}
}

/**
 * Flip PENDING reservations that are past their hold window to EXPIRED and
 * return their tickets to the pool.
 *
 * Called both lazily (before any read or write that depends on ticket
 * availability) and from the periodic sweep, so the two can never disagree.
 * Scope to a raffle where possible to keep the write set small.
 */
export async function releaseExpired(tx: Tx, raffleId?: string) {
	const expired = await tx.reservation.findMany({
		where: {
			status: "PENDING",
			expiresAt: { lt: new Date() },
			...(raffleId ? { raffleId } : {}),
		},
		select: { id: true },
	});

	if (expired.length === 0) {
		return 0;
	}

	const ids = expired.map((reservation) => reservation.id);

	await tx.ticket.updateMany({
		where: { reservationId: { in: ids } },
		data: { status: "FREE", reservationId: null },
	});
	await tx.reservation.updateMany({
		where: { id: { in: ids } },
		data: { status: "EXPIRED" },
	});

	return ids.length;
}

export type CreateReservationInput = {
	raffleSlug: string;
	numbers: number[];
	name: string;
	/** Digits only. */
	phone: string;
};

/**
 * Claim a set of numbers for a buyer, atomically.
 *
 * The guarantee comes from the conditional updateMany: it only touches rows
 * still marked FREE. Under Postgres' default READ COMMITTED, a concurrent
 * transaction targeting the same rows blocks on the row lock and then
 * re-evaluates its WHERE against the updated row version — so the loser
 * matches fewer rows than it asked for, and we roll the whole thing back.
 * No SELECT ... FOR UPDATE and no isolation change needed.
 */
export async function createReservation(input: CreateReservationInput) {
	return prisma.$transaction(async (tx) => {
		const raffle = await tx.raffle.findUnique({
			where: { slug: input.raffleSlug },
			select: { id: true, status: true },
		});

		if (!raffle) {
			throw new RaffleNotFoundError(input.raffleSlug);
		}
		if (raffle.status !== "OPEN") {
			throw new RaffleClosedError(input.raffleSlug);
		}

		await releaseExpired(tx, raffle.id);

		const expiresAt = new Date(Date.now() + HOLD_HOURS * 60 * 60 * 1000);

		// The code is derived from `sequence`, which Postgres only assigns on
		// insert, so it is written in a second step inside the same transaction.
		const created = await tx.reservation.create({
			data: {
				code: `pending-${crypto.randomUUID()}`,
				raffleId: raffle.id,
				name: input.name,
				phone: input.phone,
				expiresAt,
			},
			select: { id: true, sequence: true },
		});

		const claimed = await tx.ticket.updateMany({
			where: {
				raffleId: raffle.id,
				number: { in: input.numbers },
				status: "FREE",
			},
			data: { status: "RESERVED", reservationId: created.id },
		});

		if (claimed.count !== input.numbers.length) {
			const lost = await tx.ticket.findMany({
				where: {
					raffleId: raffle.id,
					number: { in: input.numbers },
					reservationId: { not: created.id },
				},
				select: { number: true },
				orderBy: { number: "asc" },
			});

			// Rolls back the reservation row and any tickets we did claim.
			throw new TicketsUnavailableError(lost.map((ticket) => ticket.number));
		}

		return tx.reservation.update({
			where: { id: created.id },
			data: { code: formatReservationCode(created.sequence) },
			include: {
				tickets: { select: { number: true }, orderBy: { number: "asc" } },
			},
		});
	});
}

/**
 * Pick `count` free numbers at random, server-side, so a client can never
 * claim a number it was not offered.
 */
export async function pickRandomTickets(raffleId: string, count: number) {
	const rows = await prisma.$queryRaw<Array<{ number: number }>>`
		SELECT "number" FROM "Ticket"
		WHERE "raffleId" = ${raffleId} AND "status" = 'FREE'::"TicketStatus"
		ORDER BY random()
		LIMIT ${count}
	`;

	return rows.map((row) => row.number).sort((a, b) => a - b);
}

/**
 * Create a raffle and materialize one Ticket row per number. Pre-materializing
 * is what lets the unique index on (raffleId, number) be the real guard against
 * double-selling, rather than application logic.
 */
export async function createRaffle(data: {
	slug: string;
	title: string;
	subtitle?: string | null;
	imageUrl?: string | null;
	priceCents: number;
	totalTickets: number;
	drawDate?: Date | null;
}) {
	return prisma.$transaction(async (tx) => {
		const raffle = await tx.raffle.create({ data });

		await tx.ticket.createMany({
			data: Array.from({ length: data.totalTickets }, (_, index) => ({
				raffleId: raffle.id,
				number: index + 1,
			})),
		});

		return raffle;
	});
}
