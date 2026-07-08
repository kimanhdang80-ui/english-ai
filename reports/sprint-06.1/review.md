# Sprint 6.1 — Review

- **Sprint:** 6.1 — Implement Vocabulary per spec
- **Spec(s):** [`specs/vocabulary/*`](../../specs/vocabulary/)
- **Date:** 2026-07-01

## 1. Scope delivered

- Seed expanded to **100** A1 words; **baseline migration** materialized.
- **Vitest** + 34 unit tests (SRS, quiz, pagination, service).
- Scheduled **DEBT-005** dedup (shared `toReviewCard`).
- Spec conformance review; observations logged without changing the spec.

## 2. Spec ↔ code conformance

| Spec item                            | Implemented? | Notes                                    |
| ------------------------------------ | ------------ | ---------------------------------------- |
| database.md tables/relations/indexes | ✅           | matches schema; baseline migration added |
| api.md (5 endpoints + stats)         | ✅           | unchanged since 4.1; conforms            |
| ui.md (6 screens + states)           | ✅           | unchanged since 4.1; conforms            |
| workflow.md (flows/state machine)    | ✅           | SRS transitions covered by tests         |
| validation.md (V-01…V-41)            | ✅           | domain/service rules unit-tested         |

> Divergence found: none. One ambiguity (V-02 / `pageSize=0`) → **code kept valid
> behavior; spec NOT changed**; logged SR-04 + DEBT-013 for a deliberate future spec revision.

## 3. Verification

| Check     | Result       |
| --------- | ------------ |
| typecheck | ✅           |
| lint      | ✅           |
| build     | ✅           |
| tests     | ✅ 34 passed |

## 4. Self-review findings

- Test over-specified `pageSize=0` → corrected to match valid behavior (not a code bug).
- Removed obsolete `prisma/*.generated.sql` artifacts.

## 5. Definition of Done

- [x] Acceptance criteria (unit-testable portion) pass
- [x] Docs + PROJECT_STATE + CHANGELOG + NEXT_TASK updated
- [x] Six governance reports generated
- [x] New debt logged (DEBT-013); resolved DEBT-001/005; nothing fixed silently
- [ ] Live-DB E2E + integration tests → Sprint 6.2 (no DB in this environment)
