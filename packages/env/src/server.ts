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
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
