# Task 02 — Daily Lesson Generator

> Role: Principal Learning Engineer. Replace the fixed lesson generator with a **Daily Lesson
> Generator** under Learning Model V2 (Goal → Track → Mission → Activities → Lesson). No big
> DB change, no rewrite, backward compatible. Algorithm: [DAILY_LEARNING_ALGORITHM.md](../docs/DAILY_LEARNING_ALGORITHM.md).
> Date: 2026-07-02.

## 1. What shipped

A deterministic **planning pipeline** in `src/modules/daily-loop`, plus the requested artifacts:

- **Rule Engine** (`domain/rule-engine.ts`) — decides the lesson **shape** from the review load +
  time budget. Default decider today AND the fallback when AI is unavailable. Thresholds are named
  config (`Review > 20 → no new words`, `Review < 5 → new mission`).
- **Goal Selector** (`domain/goal-selector.ts`) — `DailyGoal` from the learner profile (+ defaults).
- **Mission Selector** (`domain/mission-selector.ts`) — Track + next Mission; set index advances
  from the learner's progress. Returns `null` on review-focus days.
- **Activity Selector** (`domain/activity-selector.ts`) — ordered activities
  (Vocabulary → Dialogue → Quiz → Review) + completion criteria. Dialogue is planned but
  `available: false` (no fabricated content).
- **Lesson Planner Service** (`application/services/lesson-planner-service.ts`) — orchestrates the
  pipeline: read signals → decide (AI advisor → Rule Engine fallback) → select → assemble → **save plan**.
- **DailyLessonService** refactor — now **materializes** the plan into a backward-compatible
  `DailyLesson` (pulls real words/quiz/review from the corpus per the plan).

### Pipeline (as required)

1. Check the review queue → 2. If review is heavy, prioritize review → 3. If review is light, add a
   new mission → 4. Generate the lesson → 5. Save the Lesson Plan. (See the algorithm doc §3.)

### Each lesson carries

Mission Title · Learning Goal · Estimated Time · Activities · Completion Criteria · Difficulty ·
`decidedBy` (rule/ai) — surfaced via `LessonPlanView` on `DailyLesson.plan`.

## 2. Constraints honored

- **No hard-code / no mock / no random:** structure comes from the Rule Engine (named config);
  content comes from the real corpus; selection is deterministic (proven by a determinism test).
- **AI decides structure only** (which mission / activities / difficulty) via `LessonPlannerAiPort`;
  it is **not wired** yet (`null`), so the Rule Engine is the deterministic default. When it lands,
  any failure/decline falls back to the Rule Engine.
- **No big DB change:** the lesson plan is saved via an **in-memory** `LessonPlanRepository` skeleton
  (same pattern as sessions, DEBT-016); a durable table is deferred behind the DB gate. Profile read
  reuses `profiles`; review load reuses the existing review queue.
- **No rewrite / backward compatible:** `Exercise/Question`, SRS, and the daily player are untouched;
  `DailyLesson` keeps its fields (+ optional `plan`).
- **No UI change beyond data:** `/learn/today` passes the enriched `DailyLesson`; the player is unchanged.

## 3. Files

**Added** — `domain/{planning,rule-engine,goal-selector,mission-selector,activity-selector}.ts`;
`application/services/lesson-planner-service.ts`;
`infrastructure/{prisma-learner-profile-repository,in-memory-lesson-plan-repository,review-queue-snapshot-adapter}.ts`;
tests `domain/rule-engine.test.ts`, `domain/planner-selectors.test.ts`,
`application/services/lesson-planner-service.test.ts`; `docs/DAILY_LEARNING_ALGORITHM.md`.

**Changed** — `application/services/daily-lesson-service.ts` (materialize from plan),
`application/ports.ts` (+4 ports), `domain/entities.ts` (`DailyLesson.plan?`),
`infrastructure/container.ts` (wire planner; expose `dailyLoop.planner`),
`application/services/daily-lesson-service.test.ts` (updated for plan-driven behavior).

## 4. Verification (all green)

| Gate                   | Result                                |
| ---------------------- | ------------------------------------- |
| `npm run typecheck`    | ✅                                    |
| `npm run lint`         | ✅ no warnings                        |
| `npm run test`         | ✅ **99** passed (+18)                |
| `npm run format:check` | ✅                                    |
| `npm run build`        | ✅ 25/25 pages; `/learn/today` builds |

## 5. Follow-ups (logged)

- **AI advisor adapter** implementing `LessonPlannerAiPort` (uses the real AI provider to choose
  mission/activities/difficulty) — seam ready; Rule Engine remains the fallback.
- **Durable lesson-plan persistence** (`lesson_plans` table via the DB gate) — replaces the in-memory
  skeleton; aligns with the V2 migration (`docs/migration/`).
- **Dialogue content** — the activity is planned (`available:false`) but has no content yet; when it
  lands, the materializer and player gain a dialogue step.
- **Mission from real Track/Mission tables** — once Learning Model V2 migration (P1–P3) is applied,
  the Mission Selector can read persisted tracks/missions instead of deriving from corpus order.
