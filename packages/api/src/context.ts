import { auth } from "@rifa-app/auth/server";
import type { Context as ElysiaContext } from "elysia";

export type CreateContextOptions = {
	context: ElysiaContext;
};

/**
 * `session` is the only thing procedures are allowed to care about — never how
 * it was produced. Better Auth resolves it here from the cookie it issued at
 * /api/auth; its cookie cache keeps this off the database on most requests.
 */
export async function createContext(options: CreateContextOptions) {
	const { request } = options.context;
	const session = await auth.api.getSession({ headers: request.headers });

	return {
		session,
		reqHeaders: request.headers,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
