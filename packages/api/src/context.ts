import type { Context as ElysiaContext } from "elysia";

import {
	readSessionCookie,
	type Session,
	verifySessionToken,
} from "./lib/session";

export type CreateContextOptions = {
	context: ElysiaContext;
};

/**
 * `session` is the only thing procedures are allowed to care about. Swapping
 * the PIN for Better Auth later means changing how it is resolved here — not
 * touching any procedure. See lib/session.ts.
 *
 * `resHeaders` exists because oRPC procedures return values, not responses:
 * anything that needs to set a header (Set-Cookie on login and logout) writes
 * it here, and the Elysia route wrappers merge it into the outgoing response.
 */
export async function createContext(options: CreateContextOptions) {
	const { request } = options.context;
	const session: Session | null = await verifySessionToken(
		readSessionCookie(request.headers.get("cookie")),
	);

	return {
		session,
		reqHeaders: request.headers,
		resHeaders: new Headers(),
		clientIp:
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			options.context.server?.requestIP(request)?.address ??
			"unknown",
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
