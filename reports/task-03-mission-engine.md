# Task 03 — Mission Engine

> Role: Principal Architect + Senior Backend Engineer. Implement the **Mission Engine** per
> Learning Model V2 (no new framework, no domain redesign). Mission is central; Vocabulary,
> Dialogue, Quiz, Review are Activities. Backward compatible — legacy Lesson untouched; Lesson
> wraps Mission. Spec: [docs/MISSION_ENGINE.md](../docs/MISSION_ENGINE.md). Date: 2026-07-02.

## 1. What shipped (`src/modules/learning/**/mission`)

**Domain** — `Mission`, `MissionActivity`, `Exercise`, `Question` (+ `Answer`, `Hint`,
`Difficulty`, `explanation`), `CompletionRule`, `LearningTrack`, `MissionState`, `MissionProgress`.
Pure completion logic (`evaluateCompletion`) and the **extension registry** `ACTIVITY_BUILDERS`.

**Application (the requested components)**

- `MissionRepository` + `UserProgressPort` (ports).
- `MissionService` — public facade (plan / get view / save).
- `MissionPlanner` — decides **which** mission from **Daily Goal · Review Queue · User Progress ·
  Learning Track**.
- `ActivityPlanner` — canonical activity order + availability reconciliation.
- `CompletionService` — evaluates `CompletionRule` → status + derives lifecycle state.

**Infrastructure** — `InMemoryMissionRepository`, `InMemoryUserProgressRepository`,
`missionEngine` container, and `wrapMissionAsLesson` (Lesson-wraps-Mission adapter).

### Requirements coverage

| Requirement                                                                               | Where                                                       |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Domain: Mission / MissionActivity / Exercise / Question / CompletionRule                  | `domain/mission/entities.ts`, `completion-rule.ts`          |
| Mission supports Goal / Est. Time / Difficulty / Track / Completion Criteria / Activities | `Mission` interface                                         |
| Activity types incl. Listening/Speaking **placeholders** (interface only)                 | `ActivityType` + `ACTIVITY_BUILDERS` (placeholder builders) |
| Exercise types: Multiple Choice / Fill Blank / Match / Arrange                            | `ExerciseType`                                              |
| Question model: Question / Answer / Hint / Explanation / Difficulty                       | `Question` interface                                        |
| MissionRepository / MissionService / MissionPlanner / ActivityPlanner / CompletionService | application/mission + infra                                 |
| Planner reads Goal / Review Queue / Progress / Track                                      | `MissionPlanner.plan(context)`                              |
| Backward compatible; Lesson wraps Mission                                                 | `wrapMissionAsLesson`; legacy Lesson untouched              |

## 2. Constraints honored

- **No new framework / no redesign:** built inside the existing `learning` module following the
  migration mapping (Course → Track → **Mission** → Activity → Exercise → Question).
- **Listening/Speaking not implemented** — declared as placeholder builders (`available:false`);
  `assertActivityImplemented()` throws `NotImplementedError` for them (extension seam ready).
- **Backward compatible / no rewrite:** legacy Lesson engine and daily-loop are untouched; the
  engine is a separate `missionEngine` container; a Lesson can wrap a Mission via the adapter.
- **No big DB change:** repositories are in-memory skeletons (empty until authored/seeded) —
  durable Prisma repos land via the V2 migration DB gate (P2). Nothing fabricated.

## 3. Verification (all green)

| Gate                   | Result                  |
| ---------------------- | ----------------------- |
| `npm run typecheck`    | ✅                      |
| `npm run lint`         | ✅ no warnings          |
| `npm run test`         | ✅ **114** passed (+15) |
| `npm run format:check` | ✅                      |
| `npm run build`        | ✅ 25/25 pages          |

New tests: `completion-rule.test.ts` (4), `activity-builders.test.ts` (3), `mission-engine.test.ts`
(8 — planner, activity planner, service lifecycle).

## 4. Follow-ups (logged)

- **Persist** missions/progress via the V2 migration DB gate (P2) — swap the in-memory repos.
- **Seed/author** missions (from corpus + the daily generator) so `MissionPlanner` returns content.
- **Cutover** — wire the daily loop + UI to `missionEngine` (migration P4); until then the engine is
  code-complete and dormant (backward compatible).
- **Implement Listening/Speaking** builders; **AI advisor** to rank missions (rule fallback stays).
