---
name: orpc
description: |
  oRPC guidance for this monorepo — the type-safe API layer in packages/api served by
  apps/server and consumed by apps/web. Triggers on: adding or changing an API endpoint,
  procedures, routers, appRouter, publicProcedure, os.$context, middleware, ORPCError,
  typed errors, RPCHandler, OpenAPIHandler, RPCLink, createTanstackQueryUtils,
  queryOptions/mutationOptions/infiniteOptions, query key invalidation, @orpc/* packages.

  Use when the user asks to add an endpoint, wire the frontend to the backend, handle
  API errors, paginate, or expose something on the OpenAPI surface.
metadata:
  source: hand-authored for rifa-app (no official oRPC skill package exists)
  references:
    - https://orpc.dev/docs
    - https://orpc.dev/docs/integrations/tanstack-query
---

# oRPC in rifa-app

oRPC is the contract between `apps/server` and `apps/web`. Types flow end-to-end: a
procedure's input/output schema in `packages/api` is what the React components see.
There is no codegen step and no REST client to keep in sync — if the types break, the
build breaks.

## Where things live

| File | Role |
| --- | --- |
| `packages/api/src/index.ts` | `o = os.$context<Context>()` and `publicProcedure` |
| `packages/api/src/context.ts` | per-request context built from the Elysia context |
| `packages/api/src/routers/index.ts` | `appRouter` + `AppRouter` / `AppRouterClient` types |
| `apps/server/src/index.ts` | mounts `RPCHandler` at `/rpc*` and `OpenAPIHandler` at `/api-reference*` |
| `apps/web/src/utils/orpc.ts` | `RPCLink` → `client` → `orpc` TanStack Query utils |

The server wiring is done. **Do not touch `apps/server/src/index.ts` to add an endpoint** —
adding a procedure to `appRouter` exposes it on both surfaces automatically.

## Adding an endpoint

Add a procedure to `appRouter`. Validate input *and* output with Zod v4 (see the `zod` skill).

```ts
import * as z from "zod";
import { publicProcedure } from "../index";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => "OK"),

	listRifas: publicProcedure
		.input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
		.output(z.array(RifaSchema))
		.handler(async ({ input, context }) => {
			return db.rifa.findMany({ take: input.limit });
		}),
};
```

`.output()` is not optional busywork — without it the return type is inferred from the
handler body, so a stray field or a Prisma model leak silently becomes part of the public
API. Declare the shape you mean to expose.

### Nested routers

Group related procedures with plain object nesting. The client mirrors the shape
(`client.rifa.list(...)`, `orpc.rifa.list.queryOptions(...)`).

```ts
export const appRouter = {
	rifa: { list: listRifas, find: findRifa, create: createRifa },
	reserva: { create: createReserva, updateStatus: updateStatus },
};
```

### OpenAPI routes

`OpenAPIHandler` serves every procedure. To give one a RESTful shape, add `.route()`:

```ts
findRifa: publicProcedure
	.route({ method: "GET", path: "/rifas/{id}" })
	.input(z.object({ id: z.coerce.number().int().min(1) }))
	.output(RifaSchema)
	.handler(async ({ input }) => { /* ... */ });
```

Path params arrive as strings — use `z.coerce.*` for non-string params.

## Context and middleware

`Context` comes from `createContext` in `packages/api/src/context.ts`. It currently returns
`{ auth: null, session: null }` — auth is not configured. When a procedure needs to narrow
the context (e.g. require a logged-in organizer), build a middleware that `next()`s with a
refined context rather than asserting inside every handler:

```ts
import { ORPCError } from "@orpc/server";
import { o } from "../index";

const requireOrganizer = o.middleware(async ({ context, next }) => {
	if (!context.session) throw new ORPCError("UNAUTHORIZED");
	return next({ context: { session: context.session } });
});

export const organizerProcedure = o.use(requireOrganizer);
```

Downstream handlers now see `context.session` as non-nullable. That is the point of
threading it through `next({ context })` instead of casting.

## Errors

Throw `ORPCError` with a standard code (`BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`, …):

```ts
throw new ORPCError("NOT_FOUND", { message: "Rifa não encontrada" });
```

For errors the client should branch on, declare them with `.errors()` so they become part
of the type contract:

```ts
const reservar = publicProcedure
	.errors({
		NUMERO_INDISPONIVEL: {
			message: "Número já reservado",
			data: z.object({ numeros: z.array(z.number()) }),
		},
	})
	.input(/* ... */)
	.handler(async ({ input, errors }) => {
		if (taken.length) throw errors.NUMERO_INDISPONIVEL({ data: { numeros: taken } });
	});
```

On the client, `isDefinedError(error)` narrows to exactly those declared errors —
everything else stays an opaque failure. Prefer this over string-matching messages.

```ts
import { isDefinedError } from "@orpc/client";

if (mutation.error && isDefinedError(mutation.error)) {
	// mutation.error.data is typed
}
```

Uncaught errors are logged by the `onError` interceptors already installed on both handlers.

## Consuming from apps/web

`apps/web/src/utils/orpc.ts` exports `orpc` (TanStack Query utils) and `client` (direct
calls). Prefer `orpc` in components so caching, retries and the global error toast apply.

```ts
"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

const { data } = useQuery(orpc.rifa.list.queryOptions({ input: { limit: 20 } }));

const queryClient = useQueryClient();
const create = useMutation(
	orpc.reserva.create.mutationOptions({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.rifa.key() });
		},
	}),
);
```

Key helpers, from broad to narrow:

```ts
orpc.rifa.key()                              // every rifa.* query
orpc.rifa.key({ type: "query" })             // non-infinite only
orpc.rifa.find.key({ input: { id: 123 } })   // one specific query
orpc.rifa.find.queryKey({ input: { id } })   // for setQueryData
```

Infinite lists need an input function plus paging config:

```ts
useInfiniteQuery(
	orpc.rifa.list.infiniteOptions({
		input: (cursor: number | undefined) => ({ limit: 20, cursor }),
		initialPageParam: undefined,
		getNextPageParam: (last) => last.nextCursor,
	}),
);
```

Use `client.*` directly only outside React (server components, route handlers, scripts).

## Gotchas

- Both Elysia routes use `parse: "none"` so oRPC receives the raw request. Don't add body
  parsing in front of them.
- `AppRouterClient` is imported by the web app from `@rifa-app/api/routers/index`. Keep that
  export path stable — it is the type seam between the apps.
- `apps/server` is bundled by tsdown with `noExternal` for `@rifa-app/*`, so workspace
  packages are inlined. New workspace deps used by the API must be real dependencies of
  `packages/api`, not just present at the root.
- `@orpc/*` versions are pinned through the root `catalog:` — add new oRPC packages to the
  catalog rather than pinning a version in a workspace `package.json`.
