import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({
	path: "../../apps/server/.env",
});

export default defineConfig({
	// The directory, not a single file: the domain models live in schema.prisma
	// and Better Auth's tables in auth.prisma.
	schema: "prisma/schema",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.DATABASE_URL,
	},
});
