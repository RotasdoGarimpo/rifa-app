/**
 * The admin auth instance.
 *
 * Lives in the Bun process (apps/server) because that is where the database is:
 * packages/db generates its Prisma client with `runtime = "bun"`, so the client
 * half of this package is all apps/web ever imports.
 *
 * Browsers reach these endpoints through the /api/auth rewrite in
 * apps/web/next.config.ts, never directly — see BETTER_AUTH_URL below.
 */

import prisma from "@rifa-app/db";
import { env } from "@rifa-app/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";

/** Matches the TTL of the hand-rolled cookie this replaced. */
const SESSION_MAX_AGE = 60 * 60 * 12;

type CreateAuthOptions = {
	/**
	 * Only the seed script passes `false`. Everywhere else sign-up stays shut:
	 * this app has exactly one account and no way to ask for another.
	 */
	disableSignUp?: boolean;
};

export function createAuth(options?: CreateAuthOptions) {
	return betterAuth({
		database: prismaAdapter(prisma, { provider: "postgresql" }),
		// The origin the browser used, which the Next rewrite preserves in the
		// Origin header — not this server's own address.
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
			disableSignUp: options?.disableSignUp ?? true,
			minPasswordLength: 12,
		},
		// Would answer whether a given username exists. Nothing in the UI needs it.
		disabledPaths: ["/is-username-available"],
		session: {
			expiresIn: SESSION_MAX_AGE,
			updateAge: 60 * 60,
			// Saves a database round trip on every protected procedure.
			cookieCache: { enabled: true, maxAge: 60 * 5 },
		},
		rateLimit: {
			// Better Auth only turns this on in production by default. Brute-force
			// protection on the one door into the admin area is not something to
			// leave switched off in the environment nobody watches.
			enabled: true,
			customRules: {
				"/sign-in/username": { window: 60, max: 5 },
				"/sign-in/email": { window: 60, max: 5 },
			},
		},
		advanced: {
			// Every request arrives from the Next proxy, so without this the limiter
			// buckets every visitor under one key.
			ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
		},
		plugins: [username({ minUsernameLength: 3, maxUsernameLength: 64 })],
	});
}

export const auth = createAuth();

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
