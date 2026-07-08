# packages/database — Data access (reserved)

> Reserved placeholder (future `@english-ai/database`). Today the schema lives at
> `/prisma/schema.prisma` and the client at `src/lib/prisma.ts`.

## Intended contents

- Prisma **schema** + generated **client** (single source of the data model,
  [DATABASE.md](../../docs/DATABASE.md)).
- **Repositories** — the data-access port wrapping Prisma; the rest of the system
  depends on repository interfaces, not on Prisma directly.
- Migrations + seed scripts.

## Rule

Depends on `shared`. The **only** package that talks to Prisma/Postgres. Consumed by
`learning-engine`, `srs`, the web BFF, and the worker.
