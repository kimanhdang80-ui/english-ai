# Vocabulary Module — Overview (Spec)

> Specification for the **Vocabulary** module. This is the authoritative,
> implementation-agnostic description of what the module does and why. It reflects the
> module delivered in Sprint 4.1 and guides its hardening (Sprint 4.2+).
> Related docs: [PRODUCT.md](../../docs/PRODUCT.md), [DECISIONS.md](../../docs/DECISIONS.md)
> (D-0017…D-0021), [DATABASE.md](../../docs/DATABASE.md) §3.3, [API.md](../../docs/API.md) §6.

---

## 1. Goal

Enable a learner to **acquire and retain English vocabulary** through browse → learn →
review, using **spaced repetition** (deterministic SM-2 lite, **no AI**). It is the first
usable learning feature of the platform and the reference implementation for later skill
modules.

## 2. Target users

| Persona                   | Need                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| **Beginner learner (A1)** | Learn everyday words with meaning, IPA, example, and translation    |
| **Returning learner**     | Review due words efficiently; keep knowledge fresh                  |
| **Self-directed learner** | Choose words, favorite them, self-test with quizzes, track progress |

Primary persona: the Vietnamese A1 learner in [PRODUCT.md](../../docs/PRODUCT.md) §3.

## 3. Functions

1. **Browse & search** the A1 vocabulary corpus.
2. **View word detail** — meanings, part of speech, IPA/pronunciation, examples, audio,
   image, tags, translation.
3. **Add a word** to the learner's personal set ("learning").
4. **Flashcard review** — flip, then grade **Know** / **Review Again**, plus **Favorite**.
5. **Spaced repetition** — each grade reschedules the word (interval, ease, due date).
6. **Today's Review** — the queue of words currently due.
7. **Quiz** — self-test with Multiple Choice, Fill in the Blank, Match Word, True/False.
8. **Progress** — total words, studying, learned, due today, completion rate.

## 4. Scope (in)

- A single corpus of **A1** words (seeded product content, ~60 words to start).
- Per-learner state and review history (SRS).
- Read APIs for the corpus; write APIs for the learner's set and reviews.
- Six responsive screens (List, Detail, Flashcard, Quiz, Today's Review, Progress).
- Deterministic scheduling and quiz generation (pure, testable).

## 5. Out of scope (not included)

- **AI** of any kind (generation, semantic search, pronunciation scoring).
- **Audio/TTS generation** and image sourcing pipelines (URLs only; placeholders in UI).
- **Authoring UI / write APIs for the corpus** (words are seeded; CRUD is a later sprint).
- **Decks/collections** browsing UI (tag model exists; grouping UI is Sprint 4.2).
- **Cross-skill progress, streaks, XP, gamification** (platform-level, later epics).
- **Grammar / listening / reading** or any other skill.
- **Multi-language corpora** (English words only for now; translations to learner locale).
- **Offline mode**, push notifications for reviews.

## 6. Dependencies

- **Auth & RBAC** (Sprint 2.1) — learner-specific endpoints require an authenticated user.
- **Shared taxonomy** — `CefrLevel`, `Tag` (from the Learning Engine, Sprint 3.1).
- **Shared error hierarchy** — `src/lib/errors.ts` (D-0019).

## 7. Success signals

- A learner can complete the loop **browse → add → review → progress updates** without error.
- Due-review scheduling behaves per the SRS spec (see [workflow.md](./workflow.md), [validation.md](./validation.md)).
- All acceptance criteria in [acceptance-criteria.md](./acceptance-criteria.md) pass.

## 8. Spec index

| File                                               | Purpose                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| [overview.md](./overview.md)                       | This document                                                      |
| [database.md](./database.md)                       | Tables, fields, relations, indexes, constraints                    |
| [api.md](./api.md)                                 | Endpoint contracts (request/response/validation/errors/permission) |
| [ui.md](./ui.md)                                   | Screen-by-screen layout, components, states                        |
| [workflow.md](./workflow.md)                       | End-to-end learner flows                                           |
| [validation.md](./validation.md)                   | All validation & business rules                                    |
| [testcases.md](./testcases.md)                     | 30 functional + 20 edge cases                                      |
| [acceptance-criteria.md](./acceptance-criteria.md) | User stories + Definition of Done                                  |
| [implementation-plan.md](./implementation-plan.md) | Step-by-step build order                                           |
