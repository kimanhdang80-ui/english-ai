# Sprint 6.1 — Technical Debt (snapshot)

> Appends to the living ledger [`reports/technical-debt.md`](../technical-debt.md).

## Debt added this sprint

| ID       | Type         | Location                              | Description                                                                                          | Severity | Proposed action                             |
| -------- | ------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------- |
| DEBT-013 | spec-clarity | `specs/vocabulary/validation.md` V-02 | `pageSize = 0` handling ambiguous (default vs clamp-to-1). Code keeps a valid reading; logged SR-04. | Low      | Deliberate spec clarification in Sprint 6.2 |

## Debt paid this sprint

| ID       | How it was resolved                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| DEBT-001 | Added Vitest + 34 unit tests (SRS, quiz, pagination, service); `npm test` in CI → **RESOLVED**               |
| DEBT-005 | Extracted shared `toReviewCard` + include in `mappers.ts`; `listDue`/`listStudySet` reuse it → **RESOLVED**  |
| DEBT-004 | Baseline migration `20260701000000_init` created (Prisma-generated) → **PARTIAL** (apply on live DB pending) |
| DEBT-012 | CI now runs a unit-test job → **PARTIAL** (Postgres service + integration tests pending)                     |

## Notes

- DEBT-004/012 need a real database (none in this environment) — sequenced into Sprint 6.2.
- Ledger updated with new statuses; refactor-plan entries for DEBT-001/005 marked done.
