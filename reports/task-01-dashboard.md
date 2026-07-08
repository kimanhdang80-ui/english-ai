# Task 01 — Learning Dashboard Redesign

> Role: Senior Product Designer + Senior Frontend Engineer. Goal: turn the Dashboard from a
> stats page into a **Learning Dashboard** that answers one question — _"what should I do
> today?"_. No DB/API/package changes. Read: UI_GUIDELINE, product/LEARNING_EXPERIENCE,
> product/AI_DAILY_COACH, product/MICROCOPY_GUIDE. Date: 2026-07-02.

## 1. What shipped

Rebuilt `/dashboard` in the mandated order (mobile-first, top→bottom):

1. **Greeting** — time-of-day hello + name, 🔥 streak, and today's goal ("1 lesson + N reviews").
2. **Today's Mission** — the one thing to do: title + parts (words · quiz · review) + ~time, and a
   **single** primary CTA `Start today's lesson`.
3. **Today's Review** — two numbers only: **Need review** + **Mastered**, one CTA.
4. **AI Coach card** — one human, next-step message. Deterministic **mock** now, **swap seam** for
   real AI later.
5. **Weekly Progress** — 7-day bar chart (real data from review history), CSS-only (no chart dep).
6. **Weak Words** — top 5 words still being built (status `learning`/`review`, real from the queue).
7. **Recent Activity** — last session score + time (empty state until sessions persist).

Plus **states**: `Skeleton` primitive, `dashboard/loading.tsx` (skeleton mirror), `dashboard/error.tsx`
(friendly retry). Responsive, dark-mode via tokens, empty states in every data card.

## 2. Files

**Added**

- `src/components/ui/skeleton.tsx` — Skeleton primitive (animate-pulse; token bg).
- `src/lib/dashboard/coach-message.ts` — pure `buildCoachMessage` (mock, AI-swappable) + types.
- `src/components/dashboard/{greeting-header,todays-mission-card,todays-review-card,ai-coach-card,weekly-progress-chart,weak-words-card,recent-activity-card}.tsx` — 7 presentational server components.
- `src/app/(dashboard)/dashboard/loading.tsx`, `error.tsx`.

**Changed**

- `src/app/(dashboard)/dashboard/page.tsx` — full rewrite (assembles 7 sections; reads existing services only).

**Now unused (left in place, not dead-imported):** `src/components/daily/review-queue-summary.tsx`
(replaced by Today's Review + Weak Words; kept as a reusable presentational component).

## 3. Constraints honored

- **No DB change · No API change · No new package.** Uses existing `vocabulary.learner.getStats`,
  `dailyLoop.reviewQueue.getQueue`, `dailyLoop.streak.forUser`, `dailyLoop.history.recentActivity`,
  `dailyLoop.history.listSessions`. Bars are CSS (no chart lib); skeleton uses existing tailwindcss-animate.
- **Perf win (bonus):** the dashboard no longer calls `dailyLoop.lesson.buildForUser` (which triggers
  ~5 AI calls in SSR — PERF-01). Today's Mission uses the fixed lesson-plan constants instead.

## 4. Removed widgets (per brief)

- **Continue Learning** card — duplicated Start-lesson / Review-now (redundant CTA). Removed.
- **Progress bar** stats widget — replaced by Weekly Progress (activity, not a static %).
- **Review Queue 4-way breakdown** (stats-only) — replaced by focused Today's Review (2 numbers) +
  Weak Words (actionable list).
- **Quick Actions** — none existed; N/A.

## 5. Design decisions & notes

- **Language:** kept **English** microcopy to stay consistent with the rest of the app (currently all
  English), while applying MICROCOPY_GUIDE _voice_ (specific, encouraging, next-step). Full Vietnamese
  localization is a separate app-wide i18n effort (out of scope here).
- **"Dialogue" mission part:** not shown — no dialogue feature/data exists yet; showing it would imply a
  feature that isn't built. Mission shows its real parts (words · quiz · review). To be added when
  dialogue content lands.
- **AI Coach = mock, swappable:** `buildCoachMessage` is a pure function over real signals; a real
  provider (e.g. `AiTextService`) can replace it with zero change to `AiCoachCard` (mirrors the
  ExplanationPort pattern). It references the top weak word to match the intended "you mixed up X" vibe.
- **Weak Words / Recent Activity fidelity:** Weak Words is **real** (from queue status). Recent Activity
  depends on the session store, which is in-memory today (DEBT-016) → usually shows the empty state;
  it becomes fully data-backed after Sprint 8.2.

## 6. Verification (all green)

| Gate                   | Result                              |
| ---------------------- | ----------------------------------- |
| `npm run typecheck`    | ✅                                  |
| `npm run lint`         | ✅ no warnings                      |
| `npm run format:check` | ✅                                  |
| `npm run test`         | ✅ 81 passed                        |
| `npm run build`        | ✅ 25/25 pages; `/dashboard` builds |

## 7. Follow-ups (logged, not done here)

- Sprint 8.2 persistence lights up **Recent Activity** (real last session) and enables miss-rate-based
  **Weak Words** ranking.
- Wire the real AI provider into `buildCoachMessage` (swap seam ready).
- Vietnamese localization (app-wide) if the product moves to VN-first UI.
- Accessibility: the weekly chart is decorative (`aria-hidden`) with a text summary; a data table
  alternative could be added later.
