# packages/learning-engine — Pedagogy core (reserved)

> Reserved placeholder (future `@english-ai/learning-engine`). Deterministic learning
> logic described in [AI_ENGINE.md](../../docs/AI_ENGINE.md) §3.6–3.8 and
> [PRODUCT.md](../../docs/PRODUCT.md) §4.

## Intended contents

- **Daily planner** — assembles a time-boxed plan (due reviews + next content +
  weakness-targeted practice).
- **Weakness detection** — aggregates signals into a per-skill/topic profile.
- **Adaptive sequencer** — keeps difficulty in the i+1 zone (ability estimate).
- **Mastery model** — rolls activity results into skill mastery/XP.

## Rule

Depends on `shared` and `database`. **Deterministic and unit-testable without AI or
network** — AI only personalizes on top. Consumed by web and worker.
