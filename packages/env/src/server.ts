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
		/** Admin login name. Compared with a timing-safe check. */
		ADMIN_USERNAME: z.string().min(1),
		/**
		 * Argon2id hash of the admin password — never the password itself.
		 * Mint one with the rotation one-liner in apps/server/.env, which escapes
		 * the `$` separators Bun would otherwise expand as variable references.
		 * The prefix check below is what catches a hash mangled by that expansion.
		 */
		ADMIN_PASSWORD_HASH: z.string().startsWith("$argon2", {
			error:
				"ADMIN_PASSWORD_HASH must be an argon2 hash, not a plaintext password.",
		}),
		/** HMAC key for admin session cookies. Rotating it logs everyone out. */
		SESSION_SECRET: z.string().min(32),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
