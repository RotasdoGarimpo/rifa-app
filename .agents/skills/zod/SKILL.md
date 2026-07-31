---
name: zod
description: |
  Zod v4 schema validation guidance for this monorepo — used for oRPC procedure
  input/output in packages/api, env validation in packages/env, and form parsing in
  apps/web. Triggers on: z.object, z.string, z.infer, schema validation, parse/safeParse,
  refine, transform, coerce, discriminatedUnion, ZodError, custom error messages, and
  any migration of v3 idioms (z.string().email(), message:, errorMap) to v4.

  Use when writing or reviewing a schema, shaping an API contract, validating form or
  env input, or formatting validation errors for users.
metadata:
  source: hand-authored for rifa-app (Zod ships AGENTS.md for contributors, not a usage skill)
  zodVersion: ^4.4.3 (root catalog)
  references:
    - https://zod.dev
    - https://zod.dev/v4
---

# Zod v4 in rifa-app

This repo is on **Zod v4** (`catalog:` → `^4.4.3`). Most Zod material online is v3, and the
two differ in ways that still typecheck — so v3 habits produce deprecated-but-working code
that drifts. The rules below are the ones that actually bite.

Import as `import * as z from "zod"`. Add Zod to a workspace via `"zod": "catalog:"`.

## v4 rules that differ from v3

**String formats are top-level functions, not methods.**

```ts
z.email();        // not z.string().email()
z.url();
z.uuidv4();
z.iso.date();     // "2026-07-31"
z.iso.datetime();
z.e164();         // phone numbers
```

The method forms still exist but are deprecated. Top-level forms tree-shake.

**Error customization uses `error`, not `message` or `errorMap`.**

```ts
z.string().min(5, { error: "Muito curto." });

z.number({
	error: (issue) => {
		if (issue.code === "too_small") return `Valor deve ser >= ${issue.minimum}`;
	},
});
```

Returning `undefined` from the `error` function falls through to the default message —
that's the intended way to customize only some issues.

**Error formatting has top-level helpers.**

```ts
z.prettifyError(err);  // multi-line human-readable string
z.flattenError(err);   // { formErrors, fieldErrors } — good for forms
z.treeifyError(err);   // nested shape mirroring the schema
```

Use `z.prettifyError` for logs and `z.flattenError` for per-field form errors. Don't
hand-roll issue formatting.

## Writing schemas

Define the schema once and derive the type — never maintain a parallel `interface`.

```ts
export const ReservaSchema = z.object({
	nome: z.string().trim().min(3, { error: "Informe o nome completo." }),
	fone: z.string().regex(/^\d{10,11}$/, { error: "WhatsApp inválido." }),
	numeros: z.array(z.number().int().positive()).min(1),
	status: z.enum(["pendente", "pago", "expirado", "cancelado"]),
});

export type Reserva = z.infer<typeof ReservaSchema>;
```

`z.infer` is the output type. When a schema transforms or has defaults, input and output
differ — be explicit about which one you mean:

```ts
const S = z.object({ limit: z.number().default(20) });
type In = z.input<typeof S>;    // { limit?: number }
type Out = z.output<typeof S>;  // { limit: number }
```

This matters for oRPC: `.input()` handlers receive the **output** type (post-defaults,
post-coercion), while callers supply the **input** type.

### Object strictness

`z.object()` strips unknown keys. Be deliberate when that's not what you want:

```ts
z.strictObject({ ... });  // throws on unknown keys
z.looseObject({ ... });   // passes unknown keys through
```

For API inputs, default `z.object()` is right. For parsing external webhooks you intend to
forward verbatim, `looseObject` avoids silently dropping fields.

### Coercion

Use `z.coerce.*` for values arriving as strings — URL/path params, form data, env vars:

```ts
z.coerce.number().int().min(1);
z.coerce.boolean();
z.coerce.date();
```

Note `z.coerce.boolean()` follows JS truthiness, so `"false"` becomes `true`. For real
string booleans use an explicit enum + transform:

```ts
z.enum(["true", "false"]).transform((v) => v === "true");
```

### Refinements and transforms

`.refine()` for cross-field rules; put the error on the right path so forms can show it:

```ts
z.object({ inicio: z.iso.date(), fim: z.iso.date() }).refine(
	(v) => v.fim >= v.inicio,
	{ error: "Fim deve ser depois do início.", path: ["fim"] },
);
```

`.transform()` changes the output type and runs after validation. `.pipe()` chains a second
schema onto a transform's result:

```ts
z.string().transform((s) => s.replace(/\D/g, "")).pipe(z.string().length(11));
```

### Discriminated unions

Prefer over plain unions for tagged shapes — error messages point at the right member and
parsing is faster.

```ts
z.discriminatedUnion("status", [
	z.object({ status: z.literal("pago"), pagoEm: z.iso.datetime() }),
	z.object({ status: z.literal("pendente"), expiraEm: z.iso.datetime() }),
]);
```

## Parsing

`.parse()` throws `ZodError`; `.safeParse()` returns `{ success, data | error }`.

```ts
const result = ReservaSchema.safeParse(raw);
if (!result.success) {
	return { errors: z.flattenError(result.error).fieldErrors };
}
```

Use `.parse()` where a failure is a bug (trusted internal data) and `.safeParse()` at every
untrusted boundary. Inside oRPC handlers you rarely call either — the `.input()` schema has
already validated, and a failure surfaced as `BAD_REQUEST` before your handler ran.

Async schemas (`.refine` with a promise, e.g. a uniqueness check) require
`.parseAsync()` / `.safeParseAsync()`.

## Where schemas belong in this repo

- **`packages/api`** — procedure `.input()` / `.output()` schemas. Export shared entity
  schemas (e.g. `RifaSchema`, `ReservaSchema`) so the web app can reuse them for forms
  instead of redeclaring the shape.
- **`packages/env`** — `@t3-oss/env-*` wraps Zod. Add new vars there, not `process.env`.
- **`apps/web`** — reuse the API schemas for client-side form validation. A schema imported
  from `@rifa-app/api` keeps the form and the endpoint from disagreeing.

The OpenAPI surface converts these schemas via `ZodToJsonSchemaConverter` in
`apps/server/src/index.ts`, so schema descriptions and constraints show up in the reference
UI. `.describe("…")` on a field is worth it for anything non-obvious.
