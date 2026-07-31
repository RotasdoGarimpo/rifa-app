# rifa-app

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Elysia, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Elysia** - Type-safe, high-performance framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Bun** - Runtime environment
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Next.js** - Full-stack React framework (PWA-enabled)
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Prisma.

1. Start the local PostgreSQL database (Docker required):

```bash
bun run db:start
```

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

The API is running at [http://localhost:3333](http://localhost:3333) and the web app at [http://localhost:3000](http://localhost:3000).

## Git Hooks and Formatting

- Run checks: `bun run check`

## Project Structure

```
rifa-app/
├── apps/
│   ├── server/      # Backend API (Elysia, ORPC)
│   └── web/         # Next.js PWA frontend
├── packages/
│   ├── api/         # API layer / business logic
│   ├── db/          # Database schema & queries
│   ├── env/         # Validated environment variables
│   └── ui/          # Shared React component kit
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:server`: Start only the server
- `bun run dev:web`: Start only the web app
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run db:start`: Start the local PostgreSQL container (`db:watch` foreground, `db:stop` stop, `db:down` remove)
- `bun run check`: Run Biome formatting and linting
