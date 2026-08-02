/**
 * Browser half of auth. Imports nothing from ./server, so apps/web never pulls
 * in Prisma or a single server secret.
 */

import { env } from "@rifa-app/env/web";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	// The web app's own origin. next.config.ts rewrites /api/auth from here to
	// apps/server, which is what keeps the session cookie first-party.
	baseURL: env.NEXT_PUBLIC_SERVER_URL,
	plugins: [usernameClient()],
});
