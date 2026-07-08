# Vocabulary Module — Acceptance Criteria

> User stories (Connextra format) with per-story acceptance criteria (Given/When/Then)
> and a module-level Definition of Done. References validation IDs (V-##) and test IDs
> (FC/EC-##).

---

## User stories

### US-01 — Browse vocabulary

**As a** learner, **I want to** open the Vocabulary List, **so that** I can choose a word to study.

- **AC1:** Given the corpus is seeded, when I open `/vocabulary`, then I see a paginated list of published words (FC-01).
- **AC2:** Empty/loading/error states render appropriately (V-41).

### US-02 — Search a word

**As a** learner, **I want to** search by text, **so that** I can quickly find a word.

- **AC1:** Typing `q` filters by case-insensitive substring on the word (FC-03).
- **AC2:** No match shows an empty state, not an error (FC-04, V-03).

### US-03 — View word detail

**As a** learner, **I want to** see a word's meanings, IPA, examples, and translation, **so that** I understand it.

- **AC1:** `/vocabulary/{id}` shows meanings (POS + definition + translation), examples, IPA, tags (FC-05, FC-07).
- **AC2:** Unknown id → a not-found page (FC-06, V-05).

### US-04 — Add a word to learning

**As a** learner, **I want to** add a word, **so that** it enters my study set and review queue.

- **AC1:** Adding creates a `new`, immediately-due entry (FC-08).
- **AC2:** Adding the same word twice does not duplicate it (FC-09, V-14).
- **AC3:** The button reflects success ("Added ✓") and prevents double submit (FC-11, V-38).

### US-05 — Review with flashcards

**As a** learner, **I want to** flip a card and grade Know / Review Again, **so that** my recall is scheduled.

- **AC1:** Front shows word, IPA, part of speech; back shows meaning, example, image/placeholder, audio (ui.md §3).
- **AC2:** "Know" (good) and "Review Again" (again) reschedule per SRS (FC-12…FC-15).
- **AC3:** Each grade writes one ReviewHistory row atomically (FC-16, V-24).

### US-06 — Favorite a word

**As a** learner, **I want to** favorite a word, **so that** I can find important words later.

- **AC1:** Toggling favorite persists (FC-18, FC-19).
- **AC2:** Optimistic UI reverts on failure (EC-21, V-39).

### US-07 — Today's review (SRS)

**As a** learner, **I want to** review exactly the words due today, **so that** I retain them efficiently.

- **AC1:** `/reviews/today` returns only due, non-mastered cards ordered by due date (FC-21, V-27).
- **AC2:** A word just graded "good" is no longer due the same day (FC-23).
- **AC3:** Nothing due → friendly empty state (FC-22, EC-24-adjacent).

### US-08 — Self-test with a quiz

**As a** learner, **I want to** take a quiz of four question types, **so that** I can test myself.

- **AC1:** With ≥4 words, a mixed quiz (MC / fill-blank / match / true-false) is generated (FC-24, V-30).
- **AC2:** Answers are graded and a final score shown (FC-25…FC-28).
- **AC3:** With <4 words, the quiz shows a "not enough words" state (EC-17).

### US-09 — See my progress

**As a** learner, **I want to** see totals and completion, **so that** I know how I'm doing.

- **AC1:** Progress shows total, studying, learned, due today, and a completion bar (FC-29, FC-30).
- **AC2:** Empty corpus → 0% with no error (EC-18, V-36).

### US-10 — Security & ownership

**As a** learner, **I want** my data to be private, **so that** no one else can read or change it.

- **AC1:** Learner endpoints require auth (EC-01, V-11).
- **AC2:** I cannot access another learner's entries (EC-03, V-12).
- **AC3:** I must add a word before I can review it (EC-04, V-18).

---

## Definition of Done (module)

**Functional**

- [ ] All 10 user stories' acceptance criteria pass.
- [ ] The loop **browse → add → review → progress updates** works end-to-end on a real DB.
- [ ] SRS transitions match V-18…V-29; quiz rules match V-30…V-33.

**Quality**

- [ ] `typecheck`, `lint`, `format`, `build` all green.
- [ ] Unit tests for the SRS scheduler and quiz generator (deterministic) pass.
- [ ] Service tests (mocked ports) + at least one repository integration test pass in CI.
- [ ] Functional + edge test cases in [testcases.md](./testcases.md) covered.

**Non-functional**

- [ ] Screens are responsive (mobile → desktop) and meet WCAG 2.2 AA basics (ui.md §8).
- [ ] No answer keys leaked by the API (V-31); ownership enforced (V-12).
- [ ] No AI used; scheduling/quiz are deterministic (V-25).

**Docs**

- [ ] This spec set is the source of truth; DATABASE/API docs stay consistent.
- [ ] PROJECT_STATE, CHANGELOG, NEXT_TASK updated.

**Constraints (Sprint 5.1)**

- [ ] No code, schema, or migration changes were made — specification only.
