# packages/srs — Spaced repetition (reserved)

> Reserved placeholder (future `@english-ai/srs`). The spaced-repetition scheduler
> from [DATABASE.md](../../docs/DATABASE.md) §3.8 and [ROADMAP.md](../../docs/ROADMAP.md) S10.

## Intended contents

- **FSRS scheduler** — computes next-review date, stability, difficulty from a review
  rating (`again` / `hard` / `good` / `easy`).
- Review-queue selection helpers and retention forecasting.

## Rule

Depends on `shared` only. **Pure functions, no I/O** (persistence handled by
`database`) so the scheduling math is fully unit-tested with injected clocks — no
time-dependent flakiness. Consumed by `learning-engine`, web, and worker.
