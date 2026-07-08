# SPRINT 8.1 REPORT — Daily Learning Loop (MVP)

- **Epic:** 8 — Daily Learning Loop
- **Sprint:** 8.1
- **Date:** 2026-07-01
- **Status:** ✅ Complete — typecheck · lint · **test (62)** · build all green
- **Constraints honored:** no architecture change, **no framework expansion**, **no DB
  change**, no real AI (mock explanation). Composition of existing modules only.
- **Process:** full [PROJECT_OS.md](../docs/PROJECT_OS.md) lifecycle; governance reports in
  [`reports/sprint-08.1/`](./sprint-08.1/).

---

## 1. The loop delivered

Login → **Dashboard** → **Today's Lesson** (study ~10 words → 5-question quiz → results
with score / wrong / correct / explanation) → **add words** (SRS) → **Today's Review**
(SRS grade) → **Progress / Streak / Review Queue** update on the dashboard.

## 2. What was built (`src/modules/daily-loop`, composition)

- **Domain (pure):** `status-mapping` (SRS → NEW/LEARNING/REVIEW/MASTERED), `streak`
  (consecutive-day math), entities.
- **Application:** ports (`ExplanationPort`, `ReviewActivityRepository`,
  `SessionRepository`, `LessonSourcePort`) + services `DailyLessonService`,
  `ReviewQueueService`, `StreakService`, `LearningHistoryService`.
- **Infrastructure:** `MockExplanationAdapter` (AI seam), `PrismaReviewActivityRepository`
  (**derived from `review_history` — no new table**), `InMemorySessionRepository`
  (skeleton), `VocabularyLessonSource`, container.

## 3. UI

- **MVP Dashboard** (`/dashboard`): Today's Lesson · Today's Review · Progress · Streak ·
  Continue Learning · Review Queue breakdown · Recent activity.
- **`/learn/today`** + `DailyLessonPlayer` (study → quiz → results).
- **`QuizSession` enhanced**: score + wrong-answer review with correct answer + explanation
  (backward compatible; reused by both `/vocabulary/quiz` and the daily lesson).
- "Today" added to the nav.

## 4. Requirement coverage

| Requirement                                       | Delivered                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Daily lesson (10 words / 5 quiz / 1 review)       | ✅ `DailyLessonService`                                                |
| Review queue with NEW/LEARNING/REVIEW/MASTERED    | ✅ derived mapping                                                     |
| Quiz results (score, wrong, correct, explanation) | ✅ `QuizSession` + mock explanations                                   |
| AI explanation (mock, swappable)                  | ✅ `ExplanationPort` + `MockExplanationAdapter`                        |
| Progress + Streak                                 | ✅ stats + derived streak                                              |
| Dashboard (5 sections)                            | ✅ rebuilt                                                             |
| Learning history (time/score/completion)          | 🟡 shown client-side; persistence skeleton (DEBT-016)                  |
| Save results                                      | ✅ words persist (add/review); session persistence deferred (DEBT-016) |

## 5. Verification

| Check                  | Result                            |
| ---------------------- | --------------------------------- |
| `npm run typecheck`    | ✅                                |
| `npm run lint`         | ✅                                |
| `npm run format:check` | ✅                                |
| `npm run test`         | ✅ **62 passed** (9 files, +12)   |
| `npm run build`        | ✅ (`/dashboard`, `/learn/today`) |

New tests: `streak.test.ts` (streak + status mapping, 10), `daily-lesson-service.test.ts`
(assembly + explanations + due review, 2).

## 6. Gate compliance

- **No DB change** (streak/activity derived from `review_history`; session store in-memory)
  → DB gate not triggered.
- **No architecture change / framework expansion** — reused vocabulary via a port.
- **No ADR required.** Decisions recorded in DECISIONS D-0025…D-0028.

## 7. Debt movement

- **NEW:** DEBT-016 (session persistence — DB gate), DEBT-017 (personalized lesson selection).

## 8. Remaining work (→ Sprint 8.2)

Provision Postgres, apply migration + seed, add `learning_sessions` (DB gate) to persist
sessions, verify the loop E2E, add integration tests. See [NEXT_TASK.md](../docs/NEXT_TASK.md)
and [MVP_CHECKLIST.md](../docs/MVP_CHECKLIST.md).
