# apps/web — Next.js application (reserved)

> **Reserved placeholder.** The live web app currently lives at the **repository
> root** (`/src`, `/prisma`, `/next.config.mjs`, …). When the monorepo migration is
> triggered ([ARCHITECTURE_EVOLUTION.md](../../docs/ARCHITECTURE_EVOLUTION.md)), the
> root Next.js app moves **here** with minimal changes.

## Intended contents (post-migration)

- The Next.js App Router UI + BFF (Server Components, Route Handlers, Server Actions).
- Imports shared code from `packages/*` (`@english-ai/ui`, `@english-ai/shared`,
  `@english-ai/database`, `@english-ai/learning-engine`, `@english-ai/srs`,
  `@english-ai/ai`) instead of local `src/lib` modules.

## Why it's empty now

Extracting before there is a second consumer (mobile) or a service split would add
monorepo tooling overhead with no benefit — see [ADR-0001](../../docs/adr/ADR-0001.md).
