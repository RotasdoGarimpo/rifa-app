import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({
	path: "../../apps/server/.env",
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
