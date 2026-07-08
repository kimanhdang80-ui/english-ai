# Sprint 6.1 — Performance Review

> Findings only — logged, not fixed (PROJECT_OS §7).

## 1. Hot paths reviewed

- `GET /vocabularies` (list/search), `GET /vocabularies/{id}` (detail with includes),
  `GET /reviews/today` (+ study set), `PATCH /user-vocabulary/{id}` (review transaction),
  `GET /user-vocabulary/stats`.

## 2. Findings

| ID      | Area                | Issue                                                                                      | Evidence                  | Severity | Proposed action                                                                        |
| ------- | ------------------- | ------------------------------------------------------------------------------------------ | ------------------------- | -------- | -------------------------------------------------------------------------------------- |
| PERF-01 | db                  | `stats()` runs 4 count queries per call                                                    | `repositories.ts stats()` | Low      | Acceptable at 100-word scale; revisit with a materialized/cached count if corpus grows |
| PERF-02 | db                  | Detail/review fetch a deep `include` (meanings/examples/pronunciations/audios/images/tags) | `vocabularyInclude`       | Low      | Fine per-word; if list ever needs full detail, select only needed fields               |
| PERF-03 | perf (pre-existing) | Edge middleware `getUser()` per request                                                    | `src/middleware.ts`       | Med      | **DEBT-007** (already logged)                                                          |

## 3. Database

- Indexes cover the query paths used this sprint: `(user_id, due_at)` for the due queue,
  `(user_id, status)` for stats, `word`/`frequency_rank` for list ordering. No N+1: list
  uses `take:1` includes; detail/review use a single query with nested includes.
- Review write is a single `$transaction` (update + history insert) — good.

## 4. Frontend

- No component changes this sprint; route sizes unchanged from Sprint 4.1.

## 5. Budgets

- Nothing regressed. Count-heavy `stats()` (PERF-01) is the only item to watch as the
  corpus scales; currently negligible.
