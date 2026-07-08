# MISSION_ENGINE.md

> The **Mission Engine** (Task 03) — the center of Learning Model V2. A **Mission** groups
> **Activities** (Vocabulary · Dialogue · Quiz · Review · Listening/Speaking placeholders); an
> Activity holds **Exercises**; an Exercise holds **Questions**. Implemented per
> [docs/migration/LEARNING_MODEL_V2.md](./migration/LEARNING_MODEL_V2.md) — not a new framework,
> not a redesign. Code: `src/modules/learning/{domain,application,infrastructure}/mission`.
> Backward compatible: the legacy Lesson tree is untouched; a Lesson **wraps** a Mission.

---

## 1. Domain (content model)

```
LearningTrack
  └─ Mission            (learningGoal · estimatedMinutes · difficulty · completionRule)
       └─ MissionActivity   (type: vocabulary|dialogue|quiz|review|listening*|speaking*)
            └─ Exercise      (type: multiple_choice|fill_blank|match|arrange)
                 └─ Question (prompt · answers · hint? · explanation? · difficulty)
```

`*` listening/speaking are **placeholders** — declared for extension, `available: false`, no
content built. `Mission` supports everything required: Learning Goal, Estimated Time, Difficulty,
Track, Completion Criteria (`CompletionRule`), and Activities.

## 2. Components (Mission Engine)

| Component            | Role                                                              | Layer        |
| -------------------- | ----------------------------------------------------------------- | ------------ |
| `MissionRepository`  | Load/save missions (in-memory now; Prisma via DB gate P2)         | port / infra |
| `UserProgressPort`   | Read completed missions + per-mission progress                    | port / infra |
| `MissionService`     | Public facade — plan / get view / save                            | application  |
| `MissionPlanner`     | Decide **which** mission (Goal · Review Queue · Progress · Track) | application  |
| `ActivityPlanner`    | Order activities + reconcile availability (extension seam)        | application  |
| `CompletionService`  | Evaluate `CompletionRule` → status + lifecycle state              | application  |
| `evaluateCompletion` | Pure completion logic                                             | domain       |
| `ACTIVITY_BUILDERS`  | Extension registry (add a skill = add a builder)                  | domain       |

## 3. Mission Lifecycle

```
locked ──(prerequisite met / unlocked)──▶ available
available ──(first activity started)──▶ in_progress
in_progress ──(CompletionRule satisfied)──▶ completed
in_progress ──(more activities remain)──▶ in_progress   (stays)
completed ──(terminal)                                   (mission done)
```

- **locked → available:** gated by `unlocked` (e.g. the previous mission is completed).
- **available → in_progress:** the learner completes ≥ 1 activity.
- **in_progress → completed:** `CompletionService.evaluate(...).isComplete === true`.
- State is **derived** from progress (not stored as mutable status) — deterministic and rebuildable.

### State diagram (text)

```
        +--------+     unlock      +-----------+   start activity   +-------------+
        | locked | --------------> | available | -----------------> | in_progress |
        +--------+                 +-----------+                    +------+------+
                                                                          |
                                                        rule satisfied    | rule not yet met
                                                                          v            (loops)
                                                                    +-----------+
                                                                    | completed |
                                                                    +-----------+
```

## 4. Decision Rules

### 4.1 Mission selection (`MissionPlanner.plan`)

Reads **Daily Goal · Review Queue · User Progress · Learning Track**:

```
IF reviewDueNow > 20            → reason = review_focus     (mission = null; do review today)
ELSE next = first mission in track (by sortOrder) NOT in completedMissionIds
     IF next exists             → reason = next_mission     (mission = next)
     ELSE                       → reason = track_complete    (mission = null)
```

`20` mirrors `DAILY_LEARNING_ALGORITHM.md`'s review-heavy threshold (kept local to avoid a
wrong-direction module dependency). Deterministic — same inputs → same mission.

### 4.2 Completion (`evaluateCompletion`)

```
completable = activities where available == true            (placeholders excluded)
done        = completable ∩ progress.completedActivityIds
IF rule == all_available_activities → complete when done == completable
IF rule == min_quiz_score           → complete when done == completable AND quizScore >= minQuizScore
```

### 4.3 Activity ordering (`ActivityPlanner.order`)

Canonical order **Vocabulary → Dialogue → Quiz → Review → Listening → Speaking**, then by each
activity's `sortOrder`. Availability is reconciled against the registry, so placeholders can never
appear runnable.

## 5. Flow (typical day)

```
Daily planner (Task 02) ──gives──▶ Goal + Review load + Track
        │
        ▼
MissionService.planNextForUser(goal, reviewDueNow, track, userId)
        │  (reads UserProgress.completedMissionIds)
        ▼
MissionPlanner.plan(...)  ──▶  { mission, reason }
        │
   reason = next_mission ─▶ MissionService.getForUser(userId, mission.id)
        │                        ├─ ActivityPlanner.order(mission)   → ordered activities
        │                        └─ CompletionService.stateFor(...)  → lifecycle state
   reason = review_focus  ─▶ skip new mission; the day is review (existing review flow)
   reason = track_complete ─▶ offer the next track / celebrate
```

## 6. Extension Points

- **New activity skill** (listening, speaking, grammar, reading, …): register an `ActivityBuilder`
  in `ACTIVITY_BUILDERS` (`domain/mission/activity-builders.ts`). Placeholders already exist for
  listening/speaking; `assertActivityImplemented()` guards code paths until they're built.
- **New exercise format**: add to `ExerciseType` + the renderer (UI); the engine is format-agnostic.
- **New completion rule**: extend `CompletionRule.type` + a branch in `evaluateCompletion`.
- **Durable storage**: implement `MissionRepository` / `UserProgressPort` with Prisma when the V2
  `missions` tables land (migration P2) — swap at the container, no service change.
- **Mission selection strategy**: `MissionPlanner` is injectable; an AI advisor could rank missions
  (mirrors the daily planner's AI seam) with the deterministic rule as fallback.

## 7. Backward compatibility

- The legacy `Lesson` engine (`courses/units/lessons` + services/repos) is **unchanged**.
- **Lesson wraps Mission**: `wrapMissionAsLesson(mission)` (`infrastructure/mission/lesson-mission-adapter.ts`)
  renders a Mission into a lesson-shaped view, so existing lesson consumers can be fed from the
  Mission Engine without a rewrite.
- The Mission Engine is exposed via its own container (`missionEngine`), separate from `learning`.

## 8. Status & follow-ups

- **Now:** engine is code-complete + unit-tested; stores are in-memory skeletons (empty until
  authored/seeded) — nothing fabricated.
- **Next:** persist via the V2 migration DB gate (P2); seed missions from the corpus/authoring;
  wire the daily loop + UI to `missionEngine` (Learning Model V2 cutover, migration P4).
