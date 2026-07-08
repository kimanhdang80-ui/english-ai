# Sprint 6.1 — Architecture Review

## 1. Layering & boundaries

- Domain free of framework/Prisma? **Yes** — `srs.ts`, `quiz.ts`, `entities.ts` are pure;
  tests import them with no DB/framework.
- Application depends only on ports? **Yes** — services take repository interfaces; the
  new service test injects a mock port + a clock (dependency inversion in action).
- Infrastructure implements ports; presentation adapts only? **Yes** — the dedup added a
  mapper in `infrastructure/mappers.ts`; no logic leaked upward.
- No business logic in `page.tsx` / route handlers? **Yes** — unchanged.

## 2. Module boundaries

- New cross-module coupling introduced? **No new** coupling. Existing pagination reuse
  (`vocabulary` → `learning/domain/pagination`) is unchanged and still tracked as **DEBT-006**.
- Reuse vs duplication: **DEBT-005 duplication removed** via shared `toReviewCard`.

## 3. SOLID / DDD adherence

- **SRP:** SRS scheduling isolated in `schedule()`; quiz generation in `generateQuiz()`.
- **DIP:** services depend on `UserVocabularyRepository`/`VocabularyRepository` abstractions;
  the test substitutes a mock — confirms the seam.
- **DDD:** value-object-style pure domain (SRS/quiz/pagination); repositories are the
  persistence boundary; the review write stays a single transaction (invariant preserved).

## 4. Architecture drift

| Drift        | Where                          | Severity | Action               |
| ------------ | ------------------------------ | -------- | -------------------- |
| (none new)   | —                              | —        | —                    |
| pre-existing | pagination cross-module import | Low/Med  | DEBT-006 (scheduled) |

## 5. ADR check

- No ADR violated. **No new ADR required** — the baseline migration materializes the
  already-approved schema (ADR-0002 + DECISIONS D-0009…D-0021); it is not a schema change,
  so the DB gate (PROJECT_OS §4) does not trigger.

## 6. Verdict

**Aligned ✅** — boundaries respected, one debt paid down (DEBT-005), no new drift.
