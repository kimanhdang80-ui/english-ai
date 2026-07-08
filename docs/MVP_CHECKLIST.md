# MVP_CHECKLIST.md — English AI (Vocabulary MVP)

> Readiness tracker for a **private beta** of the vocabulary learning loop. Updated each
> sprint. Legend: ✅ done · 🟡 works but needs a live DB to be usable · ⬜ not started.

---

## What a user can already do (code-complete)

- ✅ **Sign up / log in / reset password / verify email** (Supabase Auth, Sprint 2.1).
- ✅ **See a real dashboard** — Today's Lesson, Today's Review, Progress, Streak,
  Continue Learning, Review Queue breakdown, Recent activity (Sprint 8.1).
- ✅ **Do a daily lesson** — study ~10 A1 words (flip + add to their set) → 5-question
  quiz → results with score, wrong answers, correct answers, and (mock) explanations.
- ✅ **Browse/search 100 A1 words**; view word detail (meaning, IPA, example).
- ✅ **Review with spaced repetition** — flashcards (Know / Review Again / Favorite);
  deterministic SM-2 scheduler.
- ✅ **See progress & a review queue** with NEW / LEARNING / REVIEW / MASTERED statuses.
- ✅ **Streak** derived from review activity.

## Works but needs a live database (🟡 — no DB in the build environment)

- 🟡 The whole loop **runs** only once Postgres/Supabase is provisioned and the migration
  and seed are applied (DEBT-004). All code + a baseline migration + 100-word seed exist.
- 🟡 **Learning-session history** (time studied / score / completion) is an in-memory
  skeleton — the summary shows client-side but isn't persisted (DEBT-016).
- 🟡 **Repositories** are unit-covered via services; **integration tests** vs a real DB
  are pending (DEBT-012).

## Quality gates (green)

- ✅ TypeScript strict, ESLint, Prettier — clean.
- ✅ `npm run build` — succeeds.
- ✅ `npm run test` — **62** unit tests (SRS, quiz, pagination, services, streak,
  status-mapping, prompt renderer, content validator, generator).

---

## Still missing before public beta

### Must-have (blockers)

- ⬜ **Provision Postgres/Supabase** and apply migration + seed (Sprint 8.2 / DEBT-004).
- ⬜ **Persist learning sessions** (`learning_sessions` table via DB gate) (DEBT-016).
- ⬜ **Supabase → `profiles` sync** + default `student` role on sign-up, or new users have
  no profile/role (Sprint 2.2 / DEBT-008).
- ⬜ **Integration tests** + Postgres in CI (DEBT-012).
- ⬜ **Real word audio + images** (currently URLs/placeholders).

### Should-have

- ⬜ **AI explanations/generation** (replace the mock `ExplanationPort` / stub `LlmPort`)
  (Sprint 7.2 / DEBT-014/015).
- ⬜ **Personalized lesson selection** (skip mastered, target weak/new) (DEBT-017).
- ⬜ Onboarding + placement; email deliverability; rate-limit store on Redis (DEBT-010).
- ⬜ Accessibility pass (WCAG 2.2 AA), empty/error/loading polish.
- ⬜ Learning-engine authoring (Sprint 3.2 / DEBT-009); grammar/listening/reading skills.

### Nice-to-have

- ⬜ Gamification (XP, badges, leagues), notifications/reminders, offline review.
- ⬜ TOEIC/IELTS/Business/Kids tracks; mobile app.

---

## Beta go/no-go summary

**The vocabulary loop is code-complete and green.** The only hard blocker to a private beta
is **provisioning a database and persisting sessions/profiles** (Sprint 8.2 + Sprint 2.2).
Everything else on the must-have list is small and scheduled. AI is optional for beta (the
mock explanation is acceptable) and can land in Sprint 7.2.
