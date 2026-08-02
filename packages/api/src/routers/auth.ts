import * as z from "zod";

import { protectedProcedure, publicProcedure } from "../index";

/**
 * Signing in and out is Better Auth's job, at /api/auth — see
 * packages/auth/src/server.ts. What is left here is the read side: the two
 * procedures that let the app ask about the session it already has.
 */

/** Used by the admin page to decide whether to show the login form. */
const me = publicProcedure
	.route({ method: "GET", path: "/auth/me" })
	.output(z.object({ authenticated: z.boolean() }))
	.handler(async ({ context }) => ({
		authenticated: context.session !== null,
	}));

/** Cheapest way to exercise the protected path end to end. */
const ping = protectedProcedure
	.route({ method: "GET", path: "/auth/ping" })
	.output(z.object({ ok: z.literal(true) }))
	.handler(async () => ({ ok: true as const }));

export const authRouter = { me, ping };
