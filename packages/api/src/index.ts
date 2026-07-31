import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

/**
 * Requires an admin session. The single place authorization is enforced —
 * procedures below this never inspect cookies or tokens themselves.
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
