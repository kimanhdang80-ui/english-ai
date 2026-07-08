# UX Walkthrough — 20 Beginner Learners

> **Goal:** no new features. Role-play 20 absolute-beginner learners through the full loop
> (Login → Dashboard → Study 10 words → Quiz → AI explanation → Review → Dashboard). For each
> step: confusing points, redundant actions, UX suggestions. **Then fix only what directly
> hurts the learning experience.** Date: 2026-07-01. Verified green (typecheck · lint · 81
> tests · build). Cross-ref: [beta-readiness](./beta-readiness.md), [MASTER_BACKLOG](../MASTER_BACKLOG.md).

Legend: 🟥 confusing · 🟧 redundant · 💡 suggestion · ✅ FIXED this pass · ⏭️ noted, deferred
(would add a feature / risk scope creep).

---

## Step 1 — Login → Dashboard

**Files:** `components/auth/login-form.tsx`, `app/(dashboard)/dashboard/page.tsx`

- Login form is clean (labels + autocomplete + "Forgot password?" + "Sign up"). No
  learning-blocking issues.
- 🟥 **"0 of 0 words learned · 0%"** on the Progress card for a brand-new user reads as broken.
  → ✅ **FIXED:** now shows _"No words yet — start today's lesson to begin."_ when the set is empty.
- 🟧 **Three primary CTAs overlap for a new user.** "Continue Learning" points to `/learn/today`
  (same as "Start lesson") when nothing is due, and "Today's Review" leads to an empty review
  page ("0 words due now"). Two of three buttons do the same thing.
  → ⏭️ **Deferred:** removing/merging the card would drop a documented dashboard feature. Logged as
  a redundancy to reconsider (make "Continue Learning" state-aware) — not fixed to avoid scope creep.
- 💡 The streak "🔥 0 day streak" for a new user is fine; consider a first-run nudge later
  (feature — not in scope).

## Step 2 — Dashboard → Study 10 words

**Files:** `app/(dashboard)/learn/today/page.tsx`, `components/daily/daily-lesson-player.tsx`

- 🟥 **The study→review link is invisible.** Beginners flip 10 words but never learn that "Add to
  my words" is what puts a word into their review queue. Skip it → the dashboard review stays
  empty → "why is nothing due?" confusion. This directly breaks the learning loop.
  → ✅ **FIXED:** added a one-line tip under the revealed card — _"Add to my words saves this word to
  your review queue, so spaced repetition brings it back on the right day."_
- 🟧 Two clicks per word ("Show meaning" → "Next word") × 10. The recall-first flip is pedagogically
  intentional, so kept. Not redundant enough to change without altering the learning model.
- 💡 The "you also have a word due for review" hint shows during the whole lesson (incl. quiz).
  Minor distraction; left as-is (removing it would hide a useful pointer).
- Stale code comment claimed "No AI — explanations come from the mock service." → ✅ **FIXED**
  (comment now reflects the real AI port + fallback). Non-user-facing but avoids misleading the next dev.

## Step 3 — Quiz

**File:** `components/vocabulary/quiz-session.tsx`

- 🟥 **Inconsistent, color-only feedback — the biggest learning issue.** Fill-in-the-blank showed a
  text result ("Correct!" / "Answer: X"), but **Multiple Choice and True/False showed the outcome
  only via green/red borders** — no words. A beginner who guesses right isn't told they were right,
  and a wrong guess doesn't state the correct answer in text. (Also fails colorblind users.)
  → ✅ **FIXED:** MC, True/False, and Match now show an explicit `aria-live` result line
  ("Correct!" / "Answer: …" / "Check the correct matches above."), matching Fill-in-the-blank. Every
  question type now tells the learner the outcome **and** the correct answer in words.
- 🟥 **Raw enum question titles** ("multiple choice", "fill blank", "true false", "match") read
  awkwardly for beginners.
  → ✅ **FIXED:** friendly titles — "Multiple choice", "Fill in the blank", "True or false",
  "Match the words".
- 💡 Match uses a raw `<select>` (un-tokenized); noted in the a11y/UI audit — left (styling, not
  learning-blocking).

## Step 4 — AI explanation

**File:** `components/vocabulary/quiz-session.tsx` (completion → "Review your answers")

- 🟥 **The explanation wasn't labelled.** On the wrong-answers review the AI explanation rendered as
  an unlabelled muted paragraph under "Answer: X" — beginners didn't recognise it as the "why".
  → ✅ **FIXED:** prefixed with a bold **"Why:"** so the explanation is clearly the teaching moment.
- 💡 Explanations appear only for **wrong** answers (correct answers skip the review list). Surfacing
  a short "why" on correct answers too would reinforce learning — but that's a behavioural/feature
  change → ⏭️ **deferred** (out of scope; logged as a learning-enhancement idea).

## Step 5 — Review (spaced repetition flashcards)

**File:** `components/vocabulary/flashcard-session.tsx`

- 🟥 **"Know" vs "Review again" is unexplained** — a beginner can't tell that "Review again" means
  "I didn't remember" (and schedules it sooner).
  → ✅ **FIXED:** added a one-line hint under the buttons — _"Know = you remembered it (comes back
  later) · Review again = shows it again soon."_
- 🟧 / 🟥 **The loop dead-ended.** On completion the only exits were "See progress" and "Back to
  words" — **no way back to the dashboard**, breaking the intended Review → Dashboard loop.
  → ✅ **FIXED:** completion now offers **"Back to dashboard"** (primary) + "See progress"; dropped
  the redundant "Back to words" to keep two clear, non-overlapping exits.
- Empty state ("No cards to review right now" → "Add more words") is clear. Kept.

## Step 6 — Back to Dashboard

- With Steps 2 and 5 fixed, the loop now closes cleanly: adding words is understood → words enter
  review → review returns to the dashboard → progress copy is sensible even at zero.
- ⏭️ The three-overlapping-CTA redundancy (Step 1) remains the main open dashboard nit; deferred as a
  feature-shaping decision, not a bug.

---

## Summary of fixes applied (learning-critical only, no new features)

| #   | File                                 | Change                                                                                                                                                      |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `vocabulary/quiz-session.tsx`        | Explicit `aria-live` text result for Multiple Choice / True-False / Match (parity with Fill-blank) — outcome + correct answer now in words, not color only. |
| 2   | `vocabulary/quiz-session.tsx`        | Friendly question-type titles; **"Why:"** label on the AI explanation.                                                                                      |
| 3   | `daily/daily-lesson-player.tsx`      | Tip explaining "Add to my words" → review queue; corrected stale AI comment.                                                                                |
| 4   | `vocabulary/flashcard-session.tsx`   | Hint clarifying Know vs Review again; **"Back to dashboard"** on completion (loop closes).                                                                  |
| 5   | `app/(dashboard)/dashboard/page.tsx` | New-user Progress copy ("No words yet — start today's lesson") instead of "0 of 0 · 0%".                                                                    |

**Not changed (deliberately):** the recall-first two-click study flow (pedagogical), the third
"Continue Learning" dashboard CTA (removing = dropping a feature), explanations on correct answers
(feature), Match `<select>` styling (cosmetic). These are logged above as ⏭️ / 💡.

## Verification

- `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run test` ✅ **81 passed** · `npm run build` ✅
  (25/25 pages) · `prettier` clean. No new dependencies, no schema changes, no new features.
