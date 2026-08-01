import path from "node:path";
import { fileURLToPath } from "bun";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({
	path: path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"../../.env",
	),
});

export default defineConfig({
	schema: path.join("prisma", "schema"),
	migrations: {
		path: path.join("prisma", "migrations"),
	},
	datasource: {
		url: process.env.DATABASE_URL,
	},
});
