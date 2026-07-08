# MISSION_FLOW.md

> The complete learning flow of a single mission (Task 05). Runs over the authored Mission
> Library content ([MISSION_LIBRARY.md](./MISSION_LIBRARY.md)) — **no Learning Model / Learning
> Engine / Database / Mission Library change**. Code: `src/components/mission/*`,
> `src/lib/mission-flow/*`, `src/content/mission-loader.ts`, route `/learn/mission/[missionId]`.

---

## 1. Learning Journey

```
Dashboard
  ↓  (Missions nav → pick a mission)
Today's Goal      — mission title · goal · difficulty · ~time · what's inside
  ↓
Warmup            — 30–60s: quick look at 3 words (recall priming)
  ↓
Vocabulary        — learn 8 words (word · IPA · meaning · example)
  ↓
Dialogue          — read a short natural conversation (8–10 lines)
  ↓
Practice          — Fill-Blank (×3) → Arrange-Sentence (×≤2) → Matching (×2)
  ↓
Quiz              — 5 multiple-choice questions
  ↓
Reflection        — self-assessment (what was hardest? confident to use it?)
  ↓
Session Summary   — Mission · Time · Accuracy · Words Learned · Need Review · Tomorrow's Goal
  ↓
Review Queue      — the mission's review-focus words are queued (session)
  ↓
Dashboard
```

## 2. State Flow

```
goal ─▶ warmup ─▶ vocabulary ─▶ dialogue ─▶ practice ─▶ quiz ─▶ reflection ─▶ summary ─▶ (dashboard)
```

- One linear pass; each phase advances with a single primary CTA. `nextPhase()` drives the order
  (`src/lib/mission-flow/flow.ts`); `summary` is terminal.
- **Practice** and **Quiz** are sub-steppers (one question at a time) that report a
  `{ correct, total }` result which feeds **Accuracy**.
- **Warmup** uses the first 3 mission words (recall priming — real content, no new data).
- **Arrange-Sentence** is derived from short dialogue lines (deterministic scramble via
  `src/lib/mission-flow/arrange.ts`) — no authored "arrange" content, no library change.

## 3. User Journey (what the learner feels)

| Phase        | Learner intent                | Design response                                                 |
| ------------ | ----------------------------- | --------------------------------------------------------------- |
| Goal         | "What am I doing & how long?" | One card: goal + chips (words/dialogue/practice/time) + one CTA |
| Warmup       | "Ease me in"                  | 3 fast flips; "30-second look" framing (low stakes)             |
| Vocabulary   | "Teach me the words"          | flip word → IPA → meaning + example                             |
| Dialogue     | "Show me it in use"           | short A/B conversation, readable                                |
| Practice     | "Let me try (safely)"         | fill/arrange/matching, text feedback + `aria-live`              |
| Quiz         | "Check what stuck"            | 5 MC, correct answer shown on miss                              |
| Reflection   | "Make it mine"                | 2 quick self-assessment taps                                    |
| Summary      | "Did I progress?"             | time · accuracy · words · review · tomorrow                     |
| Review Queue | "It'll come back"             | review-focus words queued (spaced repetition)                   |

## 4. Decision Points

- **Advance vs stay:** each interactive item must be _answered_ (Check / pick) before its
  Next appears — no accidental skips; Practice/Quiz can't be rushed past.
- **Arrange availability:** only dialogue lines of 3–9 words become arrange exercises (≤2). If a
  mission has none, Practice is fill-blank + matching only (graceful).
- **Reflection gating:** "See summary" is disabled until both questions are answered.
- **Tomorrow's Goal:** if the track has a next mission, the summary names it ("start '<next>'");
  otherwise it nudges review + streak.
- **Review Queue update:** on reaching the summary, the mission's `reviewFocus` (5 words) are shown
  as queued for spaced review.

## 5. Scoring & Summary

- **Accuracy** = correct ÷ total across Practice + Quiz (guarded; `accuracyPct`).
- **Time** = elapsed from Goal to Reflection-done (`durationLabel`).
- **Words Learned** = mission vocabulary count (8).
- **Need Review** = the mission's 5 review-focus words.
- **Tomorrow's Goal** = next mission in the track (from the library), else review + streak.

## 6. Boundaries (what this task did NOT change)

- **Learning Model / Learning Engine** — untouched (`src/modules/**`). The flow is presentation
  over content; the Mission Engine (Task 03) still owns the model.
- **Database schema** — untouched. Library content is not in the DB, so the review-queue update and
  session summary are **session-scoped** (computed client-side), not persisted to the global SRS.
- **Mission Library** — read-only; no missions added or edited.
- **Daily loop** (`/learn/today`) — untouched; the mission flow is an additive route.

## 7. Extension Points / Follow-ups

- **Persist** the session (time/accuracy) and the review-queue update once the library is seeded
  into the DB (Learning Model V2 migration: P2 persist, P4 cutover) — then Need-Review words feed
  the real SRS and the dashboard's Recent Activity.
- **Listening / Speaking** phases can be inserted once those activity builders + content exist
  (engine placeholders today, Task 03).
- **Audio** on vocabulary/dialogue when media is authored.
- **Reflection persistence** (store answers to personalize future missions / the AI Coach).
