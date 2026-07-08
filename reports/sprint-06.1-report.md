# SPRINT 6.1 REPORT — Implement Vocabulary (per spec)

- **Epic:** 6 — Vocabulary (spec-driven implementation)
- **Sprint:** 6.1
- **Date:** 2026-07-01
- **Status:** ✅ Complete — typecheck · lint · **test (34)** · build all green
- **Process:** ran the full [PROJECT_OS.md](../docs/PROJECT_OS.md) lifecycle (pre-code
  checklist → post-code pipeline → governance reports).
- **Spec:** implemented against [`specs/vocabulary/`](../specs/vocabulary/); **no spec
  changed** (conformance + observations in [reports/spec-review.md](./spec-review.md)).

Governance reports for this sprint: [`reports/sprint-06.1/`](./sprint-06.1/)
(review · architecture-review · technical-debt · risk-analysis · performance-review · security-review).

---

## 1. Context (what already existed)

Sprint 4.1 already delivered the vocabulary **Repository, Service, REST API, and all six
UI screens**, and Sprint 5.1's spec matches that code. So Sprint 6.1's spec-driven work was
the **remaining gaps** in the spec's implementation plan (Steps 8–11) and the debt ledger:
**seed 100 words, materialize the migration, add the test suite, and the scheduled dedup.**

## 2. Work delivered

- **Database:** seed expanded **62 → 100** A1 words; **baseline migration** created
  (Prisma-generated, 39 tables). Schema validated + client generated. **No schema change.**
- **Repository:** applied scheduled **DEBT-005** dedup — shared `toReviewCard` mapper.
- **Tests:** added **Vitest** + 34 unit tests (SRS, quiz, pagination, service); wired
  `npm test` into CI. **Resolves DEBT-001.**
- **Conformance:** reviewed spec ↔ code; module conforms; 4 non-blocking spec observations
  logged (no spec edits).

## 3. Verification

| Check       | Command                | Result                               |
| ----------- | ---------------------- | ------------------------------------ |
| Type safety | `npm run typecheck`    | ✅ 0 errors                          |
| Lint        | `npm run lint`         | ✅ clean                             |
| Format      | `npm run format:check` | ✅ clean                             |
| **Tests**   | `npm run test`         | ✅ **34 passed** (4 files)           |
| Build       | `npm run build`        | ✅ success                           |
| Prisma      | `prisma validate`      | ✅ valid; migration diff = 39 tables |

## 4. Test coverage (unit)

| File                                                              | Focus                                                                | Spec refs                               |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| `vocabulary/domain/srs.test.ts`                                   | SM-2 lite: good/again/hard/easy, thresholds, ease floor, determinism | V-19…V-25, FC-12…FC-17, EC-13/14        |
| `vocabulary/domain/quiz.test.ts`                                  | 4 kinds, <4-word threshold, distractors, determinism                 | V-30…V-33, FC-24, EC-17                 |
| `learning/domain/pagination.test.ts`                              | clamping/coercion                                                    | V-01/02, EC-10/11                       |
| `vocabulary/application/services/user-vocabulary-service.test.ts` | idempotent add, review→SRS, ownership 404, stats                     | V-14, V-18, V-12, FC-08/09/12/29, EC-04 |

## 5. Spec review outcome

Module **conforms**. One test initially over-specified `pageSize=0` handling — this exposed
a **spec ambiguity** (V-02), not a code bug. Per Project OS the spec was **not** changed and
the code was **not** bent; the test was aligned to the valid behavior and the ambiguity was
logged (SR-04 / DEBT-013) for a future deliberate spec clarification. See
[spec-review.md](./spec-review.md).

## 6. Debt movement

- **RESOLVED:** DEBT-001 (tests), DEBT-005 (dedup).
- **PARTIAL:** DEBT-004 (baseline migration created; applying on a live DB pending),
  DEBT-012 (unit-test CI job added; Postgres service/integration pending).
- **NEW:** DEBT-013 (spec V-02 ambiguity).

## 7. Deliverable lists

### Files created

- `prisma/migrations/20260701000000_init/migration.sql`
- `prisma/migrations/migration_lock.toml`
- `vitest.config.ts`
- `src/modules/vocabulary/domain/srs.test.ts`
- `src/modules/vocabulary/domain/quiz.test.ts`
- `src/modules/learning/domain/pagination.test.ts`
- `src/modules/vocabulary/application/services/user-vocabulary-service.test.ts`
- `reports/spec-review.md`
- `reports/sprint-06.1-report.md` + `reports/sprint-06.1/{review,architecture-review,technical-debt,risk-analysis,performance-review,security-review}.md`

### Files modified

- `prisma/data/a1-vocabulary.ts` (62 → 100 words)
- `src/modules/vocabulary/infrastructure/mappers.ts` (+`toReviewCard`, include)
- `src/modules/vocabulary/infrastructure/repositories.ts` (use shared mapper)
- `package.json` (vitest dep + `test`/`test:watch` scripts)
- `.github/workflows/ci.yml` (unit-test job)
- `docs/DATABASE.md`, `docs/PROJECT_STATE.md`, `docs/CHANGELOG.md`, `docs/NEXT_TASK.md`
- `reports/technical-debt.md`

### Files removed

- `prisma/*.generated.sql` (obsolete references; superseded by the migration)

### APIs added

- **None** — the 6 vocabulary endpoints already shipped in Sprint 4.1 and conform to the spec.

### Migrations added

- `20260701000000_init` (baseline; entire schema, 39 tables).

### Components added

- **None** (UI already complete in 4.1). No behavior changes to components.

### Tests added

- 4 unit-test files, **34 tests** total (see §4).

## 8. Remaining work (→ Sprint 6.2)

- Apply the migration + seed on a **live Postgres/Supabase**; verify the learn loop E2E.
- **Repository integration tests** + Postgres service in CI (close DEBT-004/012).
- Deliberate spec clarification for V-02 (DEBT-013 / SR-04).
- Then Sprint 6.3: content richness (audio/images, decks/tags) + polish.

See [NEXT_TASK.md](../docs/NEXT_TASK.md).
