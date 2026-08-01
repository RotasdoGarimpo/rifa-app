import { createEnv } from "@t3-oss/env-core";
import { config } from "dotenv";
import { z } from "zod";

config({
	path: "../../.env",
});
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
		/** Plaintext 6-digit admin PIN, compared with a timing-safe check. */
		ADMIN_PIN: z
			.string()
			.regex(/^\d{6}$/, { error: "ADMIN_PIN must be exactly 6 digits." }),
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
