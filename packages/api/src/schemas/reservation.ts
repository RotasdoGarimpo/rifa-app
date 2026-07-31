import * as z from "zod";

import { raffleSlugSchema } from "./raffle";

/** Matches the design's validation: name > 2 chars, phone >= 10 digits. */
export const buyerNameSchema = z
	.string()
	.trim()
	.min(3, { error: "Informe seu nome completo." })
	.max(80);

export const buyerPhoneSchema = z
	.string()
	.transform((value) => value.replace(/\D/g, ""))
	.pipe(
		z
			.string()
			.min(10, { error: "WhatsApp inválido." })
			.max(11, { error: "WhatsApp inválido." }),
	);

export const createReservationInputSchema = z.object({
	slug: raffleSlugSchema,
	numbers: z
		.array(z.int().positive())
		.min(1, { error: "Escolha pelo menos um número." })
		.max(50, { error: "Máximo de 50 números por reserva." })
		// The grid lets you tap the same cell twice; normalize rather than reject.
		.transform((values) => [...new Set(values)].sort((a, b) => a - b)),
	name: buyerNameSchema,
	phone: buyerPhoneSchema,
});

export const reservationSchema = z.object({
	code: z.string(),
	name: z.string(),
	phone: z.string(),
	status: z.enum(["PENDING", "PAID", "EXPIRED", "CANCELLED"]),
	numbers: z.array(z.int().positive()),
	totalCents: z.int().nonnegative(),
	expiresAt: z.date(),
	createdAt: z.date(),
	raffle: z.object({
		slug: z.string(),
		title: z.string(),
		imageUrl: z.url().nullable(),
		priceCents: z.int().positive(),
		totalTickets: z.int().positive(),
		drawDate: z.date().nullable(),
		drawChannel: z.string(),
	}),
	/** Pre-composed so the client can render a plain anchor, not a popup. */
	whatsappHref: z.url(),
	whatsappMessage: z.string(),
});

export type CreateReservationInput = z.infer<
	typeof createReservationInputSchema
>;
export type ReservationView = z.infer<typeof reservationSchema>;
