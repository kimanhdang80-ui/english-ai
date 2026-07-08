# SPRINT 5.1 REPORT — Vocabulary Specification

- **Epic:** 5 — Specification
- **Sprint:** 5.1
- **Date:** 2026-07-01
- **Role:** Senior Solution Architect
- **Type:** **Documentation only** — no business code, no schema change, no migration.
- **Status:** ✅ Complete

---

## 1. What was produced

A complete, authoritative specification for the Vocabulary module under
**`specs/vocabulary/`** — 9 documents:

| File                                                                 | Contents                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [overview.md](../specs/vocabulary/overview.md)                       | Goal, users, functions, scope, out-of-scope, dependencies, index                      |
| [database.md](../specs/vocabulary/database.md)                       | 9 tables (+ pronunciations) — fields, types, relations, indexes, constraints (no SQL) |
| [api.md](../specs/vocabulary/api.md)                                 | 5 required endpoints (+ stats) — request/response/validation/errors/permission        |
| [ui.md](../specs/vocabulary/ui.md)                                   | 6 screens — layout, components, loading/empty/error/success states                    |
| [workflow.md](../specs/vocabulary/workflow.md)                       | End-to-end flows + per-word state machine + queue rules                               |
| [validation.md](../specs/vocabulary/validation.md)                   | 41 rules (V-01…V-41) across input, auth, data, SRS, quiz, progress, UI                |
| [testcases.md](../specs/vocabulary/testcases.md)                     | **30 functional** + **25 edge** cases, cross-referenced to V-##                       |
| [acceptance-criteria.md](../specs/vocabulary/acceptance-criteria.md) | 10 user stories (Given/When/Then) + module Definition of Done                         |
| [implementation-plan.md](../specs/vocabulary/implementation-plan.md) | 11 steps (DB→Domain→Ports→Services→Infra→API→UI→Migrate→Tests→Content→Polish)         |

## 2. Coverage vs the brief

- **Database:** all requested tables specified (Vocabulary, VocabularyMeaning,
  VocabularyExample, VocabularyAudio, VocabularyImage, VocabularyTag, UserVocabulary,
  ReviewHistory) + VocabularyPronunciation for fidelity to the live schema. Each has
  description, fields, types, relations, indexes, constraints. **No SQL.**
- **API:** GET `/vocabularies`, GET `/vocabularies/{id}`, GET `/reviews/today`,
  POST `/user-vocabulary`, PATCH `/user-vocabulary/{id}` — each with request, response,
  validation, errors, and permission model (+ supporting `/user-vocabulary/stats`).
- **UI:** all six screens with layout, components, and every state.
- **Workflow / Validation / Testcases / Acceptance / Plan:** delivered, meeting or
  exceeding the required counts (≥30 functional, ≥20 edge → 30 + 25).

## 3. Key specification decisions (as architect)

- The spec **matches the implemented module** (Sprint 4.1) so it is a true source of
  truth, not a divergent redesign — consistent with [DECISIONS.md](../docs/DECISIONS.md)
  D-0017…D-0021.
- Made **ownership-based authorization** explicit for learner endpoints (401 vs 404
  semantics) and the **"cannot review a word not yet added"** invariant (V-18).
- Documented the **deterministic SRS bounds** (ease floor 1.3; interval ≥ 0; status
  thresholds 7d/30d) so tests in 4.2 have exact expectations.
- Marked the **quiz as self-test** (client-graded, no answer leakage, not persisted to
  SRS) to remove ambiguity for implementers.

## 4. Constraints honored

- ❌ No code written or modified.
- ❌ No database/schema change.
- ❌ No migration created.
- ✅ Only documentation added, plus PROJECT_STATE / CHANGELOG / NEXT_TASK updates.

## 5. Verification

- Spec docs are internally cross-referenced (V-## ↔ FC/EC ↔ user stories).
- Markdown formatting verified with Prettier (`format:check` clean).
- Application build unchanged from Sprint 4.1 (no source touched).

## 6. Next

Execute **Sprint 4.2** against this spec — implementation-plan Steps 8–11: migrate + seed
on Postgres, Vitest for SRS/quiz/services covering `testcases.md`, add audio/images and
deck/tag browsing, and accessibility/UX polish. See [NEXT_TASK.md](../docs/NEXT_TASK.md).
