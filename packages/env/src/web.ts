import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		/**
		 * UploadThing's server half runs as a Next route handler, not in
		 * apps/server, so its token lives with the web app.
		 */
		UPLOADTHING_TOKEN: z.string().min(1).optional(),
		/**
		 * Absolute origin of apps/server. Only ever used server-side: as the
		 * destination of the /rpc and /api/auth rewrites in next.config.ts, and by
		 * the UploadThing handler to validate a session. The browser never sees it
		 * — that is the whole point of the proxy.
		 */
		SERVER_ORIGIN: z.url(),
	},
	client: {
		/**
		 * The web app's *own* origin. Both the oRPC client and the Better Auth
		 * client target it, and the rewrites forward to SERVER_ORIGIN from there,
		 * which keeps the session cookie first-party.
		 */
		NEXT_PUBLIC_SERVER_URL: z.url(),
	},
	runtimeEnv: {
		UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
		SERVER_ORIGIN: process.env.SERVER_ORIGIN,
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
