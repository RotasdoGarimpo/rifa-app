import { cors } from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@rifa-app/api/context";
import { appRouter } from "@rifa-app/api/routers/index";
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

/**
 * oRPC procedures return values, not responses, so anything that needs to set
 * a header (Set-Cookie on admin login/logout) writes it to `context.resHeaders`
 * and it is merged onto the way out here.
 */
function withContextHeaders(
	response: Response | undefined,
	resHeaders: Headers,
) {
	if (!response) {
		return new Response("Not Found", { status: 404 });
	}

	if ([...resHeaders.keys()].length === 0) {
		return response;
	}

	const merged = new Headers(response.headers);
	resHeaders.forEach((value, key) => {
		merged.append(key, value);
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: merged,
	});
}

new Elysia()
	.use(
		cors({
			origin: env.CORS_ORIGIN,
			methods: ["GET", "POST", "OPTIONS"],
			// The admin session rides in a cookie, and the web app is a different
			// origin (:3000 -> :3333), so the browser drops it without this.
			credentials: true,
		}),
	)
	.all(
		"/rpc*",
		async (context) => {
			const rpcContext = await createContext({ context });
			const { response } = await rpcHandler.handle(context.request, {
				prefix: "/rpc",
				context: rpcContext,
			});
			return withContextHeaders(response, rpcContext.resHeaders);
		},
		{
			parse: "none",
		},
	)
	.all(
		"/api-reference*",
		async (context) => {
			const apiContext = await createContext({ context });
			const { response } = await apiHandler.handle(context.request, {
				prefix: "/api-reference",
				context: apiContext,
			});
			return withContextHeaders(response, apiContext.resHeaders);
		},
		{
			parse: "none",
		},
	)
	.get("/", () => "OK")
	.listen(env.PORT, () => {
		console.log(`Server is running on http://localhost:${env.PORT}`);
	});
