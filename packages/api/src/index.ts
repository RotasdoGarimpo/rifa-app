import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

/**
 * Requires an admin session. The single place authorization is enforced —
 * procedures below this never inspect cookies or tokens themselves.
 *
 * Sign-up is disabled and the only account is the one seed-admin.ts creates, so
 * "has a session" still means "is the admin". Add a role check here the day
 * that stops being true.
 */
const requireAdmin = o.middleware(async ({ context, next }) => {
	if (!context.session) {
		throw new ORPCError("UNAUTHORIZED", {
			message: "Faça login para continuar.",
		});
	}

	return next({ context: { ...context, session: context.session } });
});

export const protectedProcedure = o.use(requireAdmin);
