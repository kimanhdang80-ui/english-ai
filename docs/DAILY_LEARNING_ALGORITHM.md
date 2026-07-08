# DAILY_LEARNING_ALGORITHM.md

> How the **Daily Lesson Generator** (Task 02) decides each day's lesson under Learning Model
> V2 (Goal → Track → Mission → Activities → Lesson). Deterministic, no randomness, no
> hard-coded content, no mock. AI is an **optional advisor** for structure only; the **Rule
> Engine** is the default decider and the fallback. Code: `src/modules/daily-loop`.

---

## 1. Roles

| Concern                                                 | Who decides                        | Notes                                          |
| ------------------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| **Which** mission / activities / difficulty (structure) | AI advisor **or** Rule Engine      | AI decides structure only; falls back to rules |
| **What** the actual content is (words, quiz)            | The **corpus** (vocabulary module) | Never invented by the planner                  |
| Time budget                                             | Rule Engine (time-box)             | Trims counts to the learner's daily minutes    |

**Golden rule:** the planner plans; the corpus provides content. If AI is unavailable, the
Rule Engine produces a fully valid plan — the learner never sees a broken day.

## 2. Inputs (real signals only)

- **Review snapshot** — `{ dueNow, total, mastered }` (from the SRS-derived review queue).
- **Learner profile** — `{ goal, cefr, dailyMinutes }` (from `profiles`; safe defaults for new learners).
- **Clock** — injected (for the lesson date); deterministic in tests.

## 3. Pipeline (Lesson Planner Service)

```
                 ┌─────────────────────────────────────────────┐
                 │ 1. Read signals                             │
                 │    review snapshot  +  learner profile      │
                 └───────────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────▼─────────────────────┐
                 │ 2. Decide STRUCTURE                          │
                 │    AI advisor configured?                    │
                 │       ├─ yes → ai.decide()                   │
                 │       │        ├─ returns decision → use it  │
                 │       │        └─ null / throws ─┐           │
                 │       └─ no ───────────────────► │           │
                 │                                  ▼           │
                 │                         RULE ENGINE.decide() │  ◄── fallback
                 └───────────────────────┬─────────────────────┘
                                         │  PlanDecision
                 ┌───────────────────────▼─────────────────────┐
                 │ 3. Select Goal → Track → Mission → Activities│
                 │    GoalSelector · MissionSelector ·          │
                 │    ActivitySelector                          │
                 └───────────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────▼─────────────────────┐
                 │ 4. Assemble LessonPlan                       │
                 │    title · goal · est. time · activities ·   │
                 │    completion criteria · difficulty          │
                 └───────────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────▼─────────────────────┐
                 │ 5. Save Lesson Plan (repository)             │
                 └───────────────────────┬─────────────────────┘
                                         │  LessonPlan
                 ┌───────────────────────▼─────────────────────┐
                 │ 6. Materialize (DailyLessonService)          │
                 │    pull real words/quiz/review from corpus   │
                 │    per the plan → DailyLesson (+ plan view)  │
                 └─────────────────────────────────────────────┘
```

## 4. Decision Tree (Rule Engine)

```
START
  │
  ├─ dueNow > 20  ────────────────►  STRATEGY = review_focus
  │                                   newWords = 0
  │                                   reviews  = min(dueNow, 20)
  │                                   difficulty = consolidate
  │                                   activities = [quiz, review]
  │
  ├─ dueNow < 5   ────────────────►  STRATEGY = new_mission
  │                                   newWords = 8
  │                                   reviews  = min(dueNow, 10)
  │                                   difficulty = stretch
  │                                   activities = [vocabulary, dialogue, quiz, review]
  │
  └─ otherwise (5 ≤ dueNow ≤ 20) ─►  STRATEGY = balanced
                                      newWords = 5
                                      reviews  = min(dueNow, 10)
                                      difficulty = steady
                                      activities = [vocabulary, dialogue, quiz, review]

THEN (all strategies):
  quizCount = clamp(base, 3, 5)   where base = newWords>0 ? newWords : reviews
  TIME-BOX: while est.minutes > dailyMinutes and newWords>0 → newWords--
            while est.minutes > dailyMinutes and reviews>0  → reviews--
```

Where estimated minutes = `newWords·0.7 + quiz·0.4 + reviews·0.3 + (newWords>0 ? 3 : 0)`
(the `3` is the dialogue block), rounded up. All numbers are named configuration in
`PLANNER_RULES` / `TIME_COST` — not content.

## 5. Rules (reference)

| Rule                     | Value | Meaning                                 |
| ------------------------ | ----- | --------------------------------------- |
| `REVIEW_HEAVY_THRESHOLD` | 20    | Above → review-focus, **no new words**. |
| `REVIEW_LIGHT_THRESHOLD` | 5     | Below → add a **new mission**.          |
| `NEW_WORDS_BALANCED`     | 5     | New words on a balanced day.            |
| `NEW_WORDS_NEW_MISSION`  | 8     | New words on a light-review day.        |
| `REVIEW_CAP_FOCUS`       | 20    | Max reviews in a review-focus session.  |
| `REVIEW_CAP_DEFAULT`     | 10    | Max reviews otherwise.                  |
| `QUIZ_MIN` / `QUIZ_MAX`  | 3 / 5 | Quiz question bounds.                   |

Boundary note: `dueNow == 20` is **balanced** (strictly `> 20` triggers review-focus);
`dueNow == 5` is **balanced** (strictly `< 5` triggers new-mission).

## 6. Fallback behaviour

- **AI advisor absent** (today): Rule Engine decides — the deterministic default.
- **AI advisor present but declines** (`decide()` → `null`): Rule Engine decides.
- **AI advisor throws / times out**: caught → Rule Engine decides.
- **Profile missing** (new learner): safe defaults (`general`, `A1`, 15 min).
- **Review-focus day** (no new words): the lesson is materialized from the learner's **due
  review set** (real words) so the experience stays backward-compatible — never empty, never mock.
- **Dialogue** is always **planned** but marked `available: false` until dialogue content
  exists — the algorithm plans it; content is never fabricated.

## 7. Output: the Lesson

Every generated lesson carries (in `LessonPlan` → surfaced via `LessonPlanView`):

- **Mission Title** — e.g. "Everyday English · A1 — Set 3" (derived from goal × CEFR × progress).
- **Learning Goal** — e.g. "Learn 8 new A1 words you can use today."
- **Estimated Time** — minutes, from the time model.
- **Activities** — ordered: **Vocabulary → Dialogue → Quiz → Review** (each with item count + availability).
- **Completion Criteria** — e.g. "Complete when you study 8 words, answer 5 quiz questions, review 3 words."
- **Difficulty** — consolidate / steady / stretch.
- **decidedBy** — `rule` or `ai` (provenance).

## 8. Worked examples

| Learner state                 | Strategy                 | Plan (new / quiz / review) | Difficulty  |
| ----------------------------- | ------------------------ | -------------------------- | ----------- |
| Brand-new (dueNow 0)          | new_mission              | 8 / 5 / 0                  | stretch     |
| Steady (dueNow 10)            | balanced                 | 5 / 5 / 10                 | steady      |
| Backlog (dueNow 25)           | review_focus             | 0 / 5 / 20                 | consolidate |
| Busy (dueNow 3, 5-min budget) | new_mission (time-boxed) | trimmed <8 / … / 3         | stretch     |

## 9. Guarantees

- **Deterministic:** same inputs → same plan (proven by tests).
- **No randomness · no hard-coded content · no mock:** structure from rules/AI, content from corpus.
- **Backward compatible:** `DailyLesson` keeps its existing fields (+ optional `plan`); the daily
  player is unchanged.
- **Testable:** Rule Engine, selectors, and planner are pure/port-injected and unit-tested.
