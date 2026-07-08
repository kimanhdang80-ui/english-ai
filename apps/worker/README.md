# apps/worker — Background job processor (reserved)

> **Reserved placeholder — first planned extraction.** A standalone Node process that
> consumes a **BullMQ (Redis)** queue for work that must not run inside the Next.js
> request lifecycle.

## Intended responsibilities

- **AI lesson generation** (async, schema-validated) — from `packages/ai`.
- **TTS rendering** + dedup, **pronunciation/speaking scoring** callbacks.
- **SRS batch** scheduling and **daily-plan** generation.
- **Notifications** (reminders, streak, review-due) dispatch.

## How it stays a clean extraction

- Shares the same domain packages as the web app: `packages/database`,
  `packages/learning-engine`, `packages/srs`, `packages/ai`, `packages/shared`.
- The web app **enqueues** jobs and reads job status; the worker **executes** them.
  The queue is the boundary — no shared in-process state.

## Promotion trigger

The first durable async workload (expected Sprint 17–22, AI + media). Until then,
any incidental async can run in Route Handlers. See
[ARCHITECTURE_EVOLUTION.md](../../docs/ARCHITECTURE_EVOLUTION.md).
