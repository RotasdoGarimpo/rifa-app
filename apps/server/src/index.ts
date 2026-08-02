import { cors } from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@rifa-app/api/context";
import { appRouter } from "@rifa-app/api/routers/index";
import { auth } from "@rifa-app/auth/server";
import { env } from "@rifa-app/env/server";
import { Elysia } from "elysia";

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});
const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

const notFound = () => new Response("Not Found", { status: 404 });

new Elysia()
	.use(
		cors({
			// Browsers never hit this server cross-origin — apps/web proxies /rpc and
			// /api/auth through a Next rewrite so the session cookie stays
			// first-party. This still covers direct API and /api-reference use.
			origin: env.CORS_ORIGIN,
			methods: ["GET", "POST", "OPTIONS"],
			credentials: true,
		}),
	)
	/**
	 * Sign in, sign out and session reads. Better Auth writes its own Set-Cookie,
	 * so nothing here has to marshal headers back out.
	 */
	.all("/api/auth/*", ({ request }) => auth.handler(request), {
		parse: "none",
	})
	.all(
		"/rpc*",
		async (context) => {
			const { response } = await rpcHandler.handle(context.request, {
				prefix: "/rpc",
				context: await createContext({ context }),
			});
			return response ?? notFound();
		},
		{
			parse: "none",
		},
	)
	.all(
		"/api-reference*",
		async (context) => {
			const { response } = await apiHandler.handle(context.request, {
				prefix: "/api-reference",
				context: await createContext({ context }),
			});
			return response ?? notFound();
		},
		{
			parse: "none",
		},
	)
	.get("/", () => "OK")
	.listen(env.PORT, () => {
		console.log(`Server is running on http://localhost:${env.PORT}`);
	});
