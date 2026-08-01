import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({
	path: "../../apps/server/.env",
});

export default defineConfig({
	schema: "prisma/schema/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: process.env.DATABASE_URL,
	},
});
