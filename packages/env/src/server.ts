import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		// Must stay in sync with apps/web's NEXT_PUBLIC_SERVER_URL, which points here.
		PORT: z.coerce.number().default(3333),
		CORS_ORIGIN: z.url(),
		/** Organizer's WhatsApp, digits only. Buyers are handed off to this number. */
		ADMIN_WHATSAPP: z.string().regex(/^\d{10,13}$/),
		/** Shown to buyers when the organizer chases payment. */
		PIX_KEY: z.string().min(1),
		/** Signs Better Auth session cookies. Rotating it logs everyone out. */
		BETTER_AUTH_SECRET: z.string().min(32),
		/**
		 * The origin the *browser* uses to reach auth — which is the web app's own
		 * origin, not this server's, because apps/web proxies /api/auth through a
		 * Next rewrite. Better Auth validates the Origin header against it.
		 */
		BETTER_AUTH_URL: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
