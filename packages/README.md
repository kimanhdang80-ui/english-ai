# packages/ — Shared libraries (reserved scaffolding)

> **Status: reserved / not yet populated.** These mark the domain boundaries that
> web + worker will share once the monorepo migration is triggered
> ([ADR-0001](../docs/adr/ADR-0001.md), [ARCHITECTURE_EVOLUTION.md](../docs/ARCHITECTURE_EVOLUTION.md)).
>
> **Today**, the equivalent code lives under the root app's `src/lib` (and future
> `src/modules`). It is written **framework-light and dependency-inward** on purpose,
> so relocating it into these packages is a move, not a rewrite.

## Planned packages

| Package                                | Responsibility                                                                  | Depends on       |
| -------------------------------------- | ------------------------------------------------------------------------------- | ---------------- |
| [`shared`](./shared)                   | Cross-cutting types, DTOs/Zod schemas, constants, pure utilities, error types.  | (none)           |
| [`ui`](./ui)                           | Design system: shadcn/ui primitives, tokens, domain components (UI_GUIDELINE).  | shared           |
| [`database`](./database)               | Prisma schema/client + repositories (data-access port).                         | shared           |
| [`ai`](./ai)                           | Provider-agnostic AI ports (LLM/STT/TTS/scoring/embeddings) + prompt templates. | shared           |
| [`learning-engine`](./learning-engine) | Deterministic pedagogy: daily planner, weakness detection, adaptive sequencer.  | shared, database |
| [`srs`](./srs)                         | Spaced-repetition scheduler (FSRS) — pure, unit-tested.                         | shared           |

## Dependency rule

Dependencies point **inward** (`ui`/apps → domain → `shared`). `shared` depends on
nothing. No package imports an app. This mirrors the hexagonal rule in
[CLAUDE.md](../docs/CLAUDE.md) §3 and survives the migration unchanged.

Proposed npm scope on extraction: `@english-ai/<name>`.
