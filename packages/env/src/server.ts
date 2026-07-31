import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		// Must stay in sync with apps/web's NEXT_PUBLIC_SERVER_URL, which points here.
		PORT: z.coerce.number().default(3000),
		CORS_ORIGIN: z.url(),
		/** Organizer's WhatsApp, digits only. Buyers are handed off to this number. */
		ADMIN_WHATSAPP: z.string().regex(/^\d{10,13}$/),
		/** Shown to buyers when the organizer chases payment. */
		PIX_KEY: z.string().min(1),
		/**
		 * Argon2/bcrypt hash of the 4-digit admin PIN — never the PIN itself.
		 *
		 * The format check is not paranoia: .env performs `$VAR` expansion, so an
		 * unescaped `$argon2id$v=19$...` silently loads as `=19=65536,...` and
		 * only fails much later as an opaque "UnsupportedAlgorithm" at login.
		 * Escape every `$` as `\$` in .env.
		 */
		ADMIN_PIN_HASH: z
			.string()
			.min(1)
			.refine(
				(value) => value.startsWith("$argon2") || value.startsWith("$2"),
				{
					error:
						'ADMIN_PIN_HASH is not a valid hash. .env expands "$" — escape each one as "\\$".',
				},
			),
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
