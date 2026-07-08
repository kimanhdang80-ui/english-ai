# DASHBOARD_BEFORE_AFTER.md

> Task 01 — Learning Dashboard redesign. Before/after, UX impact, widgets removed/added, and why.
> Details: [reports/task-01-dashboard.md](./reports/task-01-dashboard.md). No DB/API/package change.

---

## 1. The core shift

|                          | Before                                         | After                                   |
| ------------------------ | ---------------------------------------------- | --------------------------------------- |
| **What it was**          | A **stats page**                               | A **Learning Dashboard**                |
| **Question it answered** | "How am I doing?" (numbers)                    | **"What should I do today?"** (action)  |
| **Primary action**       | 3 overlapping CTAs (Start / Review / Continue) | **1** clear CTA: `Start today's lesson` |
| **Emotional read**       | "Here are your metrics"                        | "Here's your coach + your next step"    |

## 2. Layout — before → after

**Before**

```
Welcome + streak
[Today's Lesson] [Today's Review] [Continue Learning]   ← 3 competing cards
[Progress bar]              [Review Queue: New/Learning/Review/Mastered]
Recent activity (list of day counts)
```

**After (mandated order)**

```
1. Greeting  — hello + name · 🔥 streak · today's goal
2. Today's Mission — words · quiz · ~time · [ Start today's lesson ]   ← single CTA
3. Today's Review        4. AI Coach card (mock, swappable)
5. Weekly Progress (7-day bar chart)
6. Weak Words            7. Recent Activity
+ Skeleton loading · friendly Error state · empty states everywhere
```

## 3. Widgets removed (and why)

| Widget                                                          | Why removed                                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Continue Learning** card                                      | Pointed to the same place as Start-lesson or Review-now → redundant third CTA that diluted the "one thing to do today" focus.                           |
| **Progress bar** (X of Y · %)                                   | Stats-only; a static percentage doesn't drive action. Replaced by **Weekly Progress** (shows momentum/consistency, the thing that matters for a habit). |
| **Review Queue 4-way breakdown** (New/Learning/Review/Mastered) | Stats-only grid. Split into **Today's Review** (2 action numbers) + **Weak Words** (an actionable list).                                                |
| **Quick Actions**                                               | Did not exist — N/A (confirmed).                                                                                                                        |

## 4. Widgets added (and why)

| Widget                              | Why added                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Today's Mission** (single CTA)    | Makes the daily action unmistakable; removes decision fatigue for a tired, time-poor learner.                                                              |
| **AI Coach card**                   | Turns the dashboard from a report into a **relationship** — one human, specific, next-step nudge. Mock now; a real AI provider swaps in with no UI change. |
| **Weekly Progress chart**           | Replaces a static % with **consistency over time** — the real signal for habit formation; motivating without being vanity.                                 |
| **Weak Words**                      | Points the learner at what to strengthen next (actionable), not just totals.                                                                               |
| **Recent Activity** (last session)  | Closes the loop — "you did this last time" — and sets up returning.                                                                                        |
| **Skeleton / Error / Empty states** | The old dashboard had none; data pages now degrade gracefully (no crash screens, no layout jump).                                                          |

## 5. UX impact

- **Focus:** from ~3 competing CTAs to **one** primary action → less decision fatigue, higher start-rate.
- **Motivation:** shifts from "metrics" to **coach + momentum** (aligns with SDT: competence + relatedness;
  see [docs/product/AI_DAILY_COACH.md](./docs/product/AI_DAILY_COACH.md)).
- **Actionability:** every remaining number is tied to a next step (review, strengthen a word).
- **Trust/robustness:** skeleton avoids blank/jumpy loads; error state keeps a data hiccup from feeling
  like "I broke it" (reassuring, teacher-voice copy).
- **Performance:** dashboard no longer builds the AI-backed daily lesson in SSR (avoids the ~5 AI calls of
  PERF-01) — faster, cheaper first paint.
- **Honesty:** no fabricated features — "Dialogue" is omitted until built; Recent Activity shows a clean
  empty state until sessions persist (Sprint 8.2).

## 6. What stays the same

- The learning flow (`/learn/today`, quiz, review) and its recent UX fixes are untouched.
- Design system, tokens, dark mode, nav — unchanged. No new dependencies.
