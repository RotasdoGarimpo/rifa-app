import * as z from "zod";

export const raffleSlugSchema = z
	.string()
	.min(1)
	.max(60)
	.regex(/^[a-z0-9-]+$/, { error: "Slug inválido." });

/** What the home page needs to render a raffle card or the hero. */
export const raffleSummarySchema = z.object({
	slug: z.string(),
	title: z.string(),
	subtitle: z.string().nullable(),
	imageUrl: z.url().nullable(),
	priceCents: z.int().positive(),
	totalTickets: z.int().positive(),
	drawDate: z.date().nullable(),
	drawChannel: z.string(),
	featured: z.boolean(),
	/** RESERVED + PAID — what the progress bar fills to. */
	takenCount: z.int().nonnegative(),
});

/**
 * The grid payload. Only non-free numbers travel: everything absent is free,
 * which keeps a heavily-sold 1000-number raffle down to a few hundred ints
 * instead of a thousand objects.
 */
export const raffleDetailSchema = raffleSummarySchema.extend({
	reserved: z.array(z.int().positive()),
	paid: z.array(z.int().positive()),
});

export const randomTicketsInputSchema = z.object({
	slug: raffleSlugSchema,
	count: z.int().min(1).max(50),
});

export type RaffleSummary = z.infer<typeof raffleSummarySchema>;
export type RaffleDetail = z.infer<typeof raffleDetailSchema>;
