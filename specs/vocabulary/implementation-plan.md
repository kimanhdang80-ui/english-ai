# Vocabulary Module — Implementation Plan

> Ordered build steps that satisfy this spec, mapped to the hexagonal layering
> (`src/modules/vocabulary`). Steps 1–7 correspond to what Sprint 4.1 delivered
> (already implemented); Steps 8–11 are the **remaining** hardening work (Sprint 4.2)
> and are the actionable part of this plan. Each step lists inputs → outputs → exit criteria.

Legend: ✅ done (Sprint 4.1) · ⬜ pending (Sprint 4.2+).

---

## Step 1 — Database ✅

- **Do:** model `vocabularies`, `vocabulary_meanings`, `vocabulary_examples`,
  `vocabulary_pronunciations`, `vocabulary_audios`, `vocabulary_images`,
  `vocabulary_tags`, `user_vocabulary`, `review_history` + enums (see [database.md](./database.md)).
- **Exit:** `prisma validate` passes; client generated. **No migration in Sprint 5.1.**

## Step 2 — Domain ✅

- **Do:** framework-free entities; **SRS scheduler** (`schedule(state, rating, now)`,
  pure, clock-injected); **quiz generator** (`generateQuiz(items)`, pure).
- **Exit:** compiles with no framework/Prisma imports; deterministic (V-25).

## Step 3 — Application ports ✅

- **Do:** `VocabularyRepository`, `UserVocabularyRepository` interfaces + filter types.
- **Exit:** services depend only on ports (hexagonal boundary).

## Step 4 — Application services ✅

- **Do:** `VocabularyService` (list/get/quizItems); `UserVocabularyService`
  (addToLearning, review→schedule, setFavorite, getTodayReviews, getStudySet, getStats).
- **Exit:** business rules V-14, V-18, V-21…V-23, V-27, V-34…V-37 encoded in services/domain.

## Step 5 — Infrastructure (repositories) ✅

- **Do:** Prisma repos + mappers + container; review persists SRS + appends history in one
  transaction (V-24); reads exclude soft-deleted / non-published (V-15, V-16).
- **Exit:** container exposes `vocabulary.catalog` / `vocabulary.learner`.

## Step 6 — API (presentation) ✅

- **Do:** route handlers for `GET /vocabularies`, `GET /vocabularies/{id}`,
  `GET /reviews/today`, `POST /user-vocabulary`, `PATCH /user-vocabulary/{id}`,
  `GET /user-vocabulary/stats`; envelope + error mapping; auth on learner endpoints.
- **Exit:** contracts match [api.md](./api.md); no business logic in handlers.

## Step 7 — UI ✅

- **Do:** List, Detail, Flashcard, Quiz, Today's Review, Progress; client components for
  Add / Flashcard session / Quiz session; responsive; nav + route protection.
- **Exit:** screens match [ui.md](./ui.md); build green.

---

## Step 8 — Migrate & seed on a live DB ⬜ (Sprint 4.2)

- **Do:** provision Postgres/Supabase; `prisma migrate dev --name vocabulary`; commit
  migration; `npm run prisma:seed` (CEFR A1 + ~60 A1 words).
- **Exit:** migration applies on a clean DB; corpus queryable; the full loop works manually.

## Step 9 — Automated tests ⬜

- **Do (unit, no DB):** SRS scheduler (V-19…V-23, thresholds) and quiz generator
  (kinds, distractors, V-30…V-33).
- **Do (integration):** service tests with mocked ports; ≥1 repository test against Postgres
  in CI; wire `npm test`.
- **Exit:** [testcases.md](./testcases.md) FC/EC covered; CI green with a Postgres service.

## Step 10 — Content richness ⬜

- **Do:** word **audio** + **images**; primary-pronunciation flag; **decks/tags** browsing
  (group A1 words by theme via the shared `Tag`).
- **Exit:** audio/image render in Flashcard/Detail; tag-filtered browsing works (V-04).

## Step 11 — Polish & accessibility ⬜

- **Do:** keyboard shortcuts (flashcards), favorites view, session-size options, loading
  skeletons, empty/error refinements, WCAG 2.2 AA pass.
- **Exit:** ui.md §7–8 satisfied; acceptance criteria non-functional checklist complete.

---

## Dependencies & sequencing

```
Step 1 → 2 → 3 → 4 → 5 → 6 → 7   (done, Sprint 4.1)
                          └→ 8 → 9   (DB + tests; do first in 4.2)
                                └→ 10 → 11   (content + polish)
```

## Risks & mitigations

| Risk                                      | Mitigation                                                      |
| ----------------------------------------- | --------------------------------------------------------------- |
| SRS parameters feel too fast/slow         | Parameters isolated in `srs.ts`; tune with unit tests (Step 9)  |
| Serverless "now" vs client timezone drift | Server owns "now"; store UTC; display in learner timezone later |
| Corpus too small for quiz                 | Enforce ≥4-word threshold (V-30); grow seed                     |
| Audio/image sourcing                      | URLs only; UI placeholders; no generation pipeline in scope     |

## Out of scope (restated)

No AI, no corpus authoring UI, no gamification, no other skills, no schema/migration in
Sprint 5.1 (specification only).
