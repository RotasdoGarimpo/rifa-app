import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEnv } from "@t3-oss/env-nextjs";
import { config } from "dotenv";
import { z } from "zod";

config({
	path: path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"../../.env",
	),
});

export const env = createEnv({
	server: {
		/**
		 * UploadThing's server half runs as a Next route handler, not in
		 * apps/server, so its token lives with the web app.
		 */
		UPLOADTHING_TOKEN: z.string().min(1).optional(),
		/**
		 * Same value as apps/server: that process signs the admin cookie, this one
		 * verifies it before accepting an upload.
		 */
		SESSION_SECRET: z.string().min(32),
	},
	client: {
		NEXT_PUBLIC_SERVER_URL: z.url(),
	},
	runtimeEnv: {
		UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
		SESSION_SECRET: process.env.SESSION_SECRET,
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
