# packages/shared — Cross-cutting primitives (reserved)

> Reserved placeholder (future `@english-ai/shared`). Today this code lives in the
> root app's `src/lib` / `src/types`. See [ADR-0001](../../docs/adr/ADR-0001.md).

## Intended contents

- Domain **types** and **DTOs / Zod schemas** shared by web, worker, and other packages.
- **Constants** and enums (CEFR levels, skill codes, error codes).
- **Pure utilities** (no framework, no I/O) and typed **error** classes.

## Rule

Depends on **nothing** in this repo. Framework-free and side-effect-free so it can be
imported anywhere (client, server, worker) safely.
