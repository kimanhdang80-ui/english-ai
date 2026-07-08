# apps/ — Deployable applications (reserved scaffolding)

> **Status: reserved / not yet populated.** These directories mark the **target
> monorepo shape**. The MVP currently runs as a **single Next.js app at the repo
> root** (`/src`, `/prisma`, etc.) per [ADR-0001](../docs/adr/ADR-0001.md).
>
> They exist now so the future split is a **move + wire-up**, not a redesign. See
> [ARCHITECTURE_EVOLUTION.md](../docs/ARCHITECTURE_EVOLUTION.md) for the migration
> plan and the exact triggers that promote each app.

## Planned apps

| App                  | Purpose                                                                                                     | Promoted when                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [`web`](./web)       | The Next.js UI + BFF (Server Components, Route Handlers).                                                   | On monorepo migration (root app moves here).   |
| [`worker`](./worker) | Background job processor (BullMQ + Redis): AI generation, TTS rendering, scoring, SRS batch, notifications. | First durable async workload (≈ Sprint 17–22). |

Additional future apps (not scaffolded yet): `realtime` (WebSocket conversation/speaking),
`mobile` (Expo). They are added when their trigger fires.
