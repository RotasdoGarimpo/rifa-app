import { env } from "@rifa-app/env/server";
import * as z from "zod";

import { protectedProcedure, publicProcedure } from "../index";
import {
	checkRateLimit,
	clearAttempts,
	recordFailure,
} from "../lib/rate-limit";
import {
	buildSessionCookie,
	clearedSessionCookie,
	createSessionToken,
	timingSafeEqual,
} from "../lib/session";

const SESSION_MAX_AGE = 12 * 60 * 60;

const login = publicProcedure
	.route({ method: "POST", path: "/auth/login" })
	.input(
		z.object({ pin: z.string().regex(/^\d{6}$/, { error: "PIN inválido." }) }),
	)
	.output(z.object({ ok: z.literal(true) }))
	.errors({
		INVALID_PIN: { status: 401, message: "PIN incorreto." },
		TOO_MANY_ATTEMPTS: {
			status: 429,
			message: "Muitas tentativas. Tente mais tarde.",
			data: z.object({ retryAfterSeconds: z.int().positive() }),
		},
	})
	.handler(async ({ input, context, errors }) => {
		const limit = checkRateLimit(context.clientIp);

		if (!limit.allowed) {
			throw errors.TOO_MANY_ATTEMPTS({
				data: { retryAfterSeconds: limit.retryAfterSeconds },
			});
		}

		const correct = timingSafeEqual(input.pin, env.ADMIN_PIN);

		if (!correct) {
			recordFailure(context.clientIp);
			throw errors.INVALID_PIN();
		}

		clearAttempts(context.clientIp);
		context.resHeaders.append(
			"set-cookie",
			buildSessionCookie(await createSessionToken(), SESSION_MAX_AGE),
		);

		return { ok: true as const };
	});

const logout = publicProcedure
	.route({ method: "POST", path: "/auth/logout" })
	.output(z.object({ ok: z.literal(true) }))
	.handler(async ({ context }) => {
		context.resHeaders.append("set-cookie", clearedSessionCookie());
		return { ok: true as const };
	});

/** Used by the admin layout to decide whether to show the keypad. */
const me = publicProcedure
	.route({ method: "GET", path: "/auth/me" })
	.output(z.object({ authenticated: z.boolean() }))
	.handler(async ({ context }) => ({
		authenticated: context.session !== null,
	}));

/** Exists so the protected path is exercised even before Phase 6 lands. */
const ping = protectedProcedure
	.route({ method: "GET", path: "/auth/ping" })
	.output(z.object({ ok: z.literal(true) }))
	.handler(async () => ({ ok: true as const }));

export const authRouter = { login, logout, me, ping };
