# Sprint <XX.Y> — Architecture Review

> Copy to `reports/sprint-<XX.Y>/architecture-review.md`. Did the sprint respect the
> architecture (layering, boundaries, SOLID, DDD)? Any drift?
> See [SYSTEM_ARCHITECTURE.md](../../docs/SYSTEM_ARCHITECTURE.md), [DECISIONS.md](../../docs/DECISIONS.md).

## 1. Layering & boundaries

- Domain free of framework/Prisma? <yes/no>
- Application depends only on ports? <yes/no>
- Infrastructure implements ports; presentation adapts only? <yes/no>
- No business logic in `page.tsx` / route handlers? <yes/no>

## 2. Module boundaries

- Cross-module coupling introduced? <describe>
- Reuse via shared kernel vs duplication? <describe>

## 3. SOLID / DDD adherence

- <notes: single responsibility, dependency inversion, aggregates, value objects…>

## 4. Architecture drift

| Drift | Where | Severity | Action (log → refactor-plan) |
| ----- | ----- | -------- | ---------------------------- |
|       |       |          |                              |

## 5. ADR check

- Any ADR violated or needing a new ADR? <describe / none>

## 6. Verdict

- Aligned ✅ / Minor drift ⚠️ / Action required ❌ — summary.
