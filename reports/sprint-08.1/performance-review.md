# Sprint 8.1 — Performance Review

> Findings only — logged, not fixed (PROJECT_OS §7).

## 1. Hot paths reviewed

- Dashboard (`getStats` + `getQueue` + `forUser` + `recentActivity` in parallel),
  `/learn/today` (`buildForUser`), review-queue mapping.

## 2. Findings

| ID      | Area | Issue                                                                                     | Evidence                          | Severity | Proposed action                                                                                            |
| ------- | ---- | ----------------------------------------------------------------------------------------- | --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| PERF-01 | db   | Dashboard runs several read queries per load (stats counts + study set + activity)        | `dashboard/page.tsx`              | Low      | Parallelized via `Promise.all`; acceptable. Cache/aggregate if it grows                                    |
| PERF-02 | db   | `getQueue` loads up to 100 study cards **with full word includes** just to count statuses | `VocabularyLessonSource.studySet` | Med      | For counts, a lighter query (select status/dueAt only) would suffice — optimize when personalization lands |
| PERF-03 | db   | Streak/activity scan `review_history` for the window (90/14 days) and group in JS         | `PrismaReviewActivityRepository`  | Low      | Fine at MVP volume; push grouping to SQL (`date_trunc`) at scale                                           |

## 3. Frontend

- Dashboard is server-rendered; `/learn/today` ships the player (~3.8 kB). No heavy client JS.

## 4. Budgets

- Nothing regressed. PERF-02 (heavy include for counts) is the one to watch as a user's set
  grows; logged, not fixed.
