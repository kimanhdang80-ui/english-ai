# SPRINT 4.1 REPORT — Vocabulary MVP

- **Epic:** 4 — Vocabulary
- **Sprint:** 4.1
- **Date:** 2026-07-01
- **Status:** ✅ Complete — typecheck, lint, build all green
- **Milestone:** the **first usable learning feature**. With a seeded DB, a learner can
  browse A1 words, add them, review with spaced repetition, quiz, and see progress.
- **No AI** (deterministic SRS + quiz). No architecture change (new module, same layering).

---

## 1. Database

9 new tables (Prisma) + 4 enums; total schema now **39 tables**. Validated + client
generated; Prisma-generated SQL confirms runnable DDL (migrations run in a DB env).

| Table                       | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `vocabularies`              | Headword entry (word, slug, cefr, frequency, status, soft-del)        |
| `vocabulary_meanings`       | Definition + part of speech + translation                             |
| `vocabulary_examples`       | Example sentences (optionally per meaning)                            |
| `vocabulary_pronunciations` | IPA + accent (us/uk)                                                  |
| `vocabulary_audios`         | Audio clip URLs                                                       |
| `vocabulary_images`         | Image URLs (placeholder in UI if none)                                |
| `vocabulary_tags`           | Join → shared `tags`                                                  |
| `user_vocabulary`           | Learner state + SRS (ease/interval/reps/lapses/dueAt/status/favorite) |
| `review_history`            | Append-only review log (ratings, interval/ease deltas)                |

Enums: `PartOfSpeech`, `VocabularyStatus` (new/learning/known/mastered),
`ReviewRating` (again/hard/good/easy), `Accent`. Cascades on children; unique
`(user_id, vocabulary_id)`; indexes on `(user_id, due_at)` and `(user_id, status)`.

## 2. API (`/api/v1`)

| Method | Path                     | Auth | Purpose                                       |
| ------ | ------------------------ | ---- | --------------------------------------------- |
| GET    | `/vocabularies`          | —    | List/search (`q`, `cefrLevelId`, `tag`, page) |
| GET    | `/vocabularies/:id`      | —    | Full word detail                              |
| POST   | `/user-vocabulary`       | user | Add word (idempotent)                         |
| PATCH  | `/user-vocabulary/:id`   | user | Review (SRS) and/or favorite                  |
| GET    | `/user-vocabulary/stats` | user | Progress summary                              |
| GET    | `/reviews/today`         | user | Due review cards                              |

Standard envelope; domain errors → HTTP (401/404/409/501…). Route handlers hold no
business logic — they call `vocabulary.catalog` / `vocabulary.learner` services.

## 3. UI (responsive)

| Route                    | Screen                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| `/vocabulary`            | **List** — search, grid, "Add to learning"                       |
| `/vocabulary/[id]`       | **Detail** — meanings, examples, IPA, image placeholder, tags    |
| `/vocabulary/flashcards` | **Flashcard** session over the study set                         |
| `/review`                | **Today's Review** — due cards (flashcards)                      |
| `/vocabulary/quiz`       | **Quiz** — Multiple Choice, Fill-in-Blank, Match, True/False     |
| `/progress`              | **Progress** — total / studying / learned / due + completion bar |

**Flashcard** shows Word, IPA, Part of Speech, Meaning, Example, Audio (play if present),
Image (placeholder if none), with **Know**, **Review Again**, **Favorite**. Grades call
`PATCH /user-vocabulary/:id`; the server SRS reschedules. Grid/stack layouts adapt from
mobile → desktop.

## 4. Seed data

~60 real **A1** words (`prisma/data/a1-vocabulary.ts`) — hello, good, book, apple,
school, teacher, student, computer, family, friend, … — each with IPA, part of speech,
plain-English definition, Vietnamese translation, and an example. The seed also creates
CEFR **A1** and is idempotent (children replaced per word). This is authored **product
content**, not throwaway demo data ([DECISIONS.md](../docs/DECISIONS.md) D-0021).

## 5. Architecture / layering

New module `src/modules/vocabulary` mirrors the Learning Engine's hexagonal layout:

```
domain/          entities.ts · srs.ts (SM-2 lite, pure) · quiz.ts (generator, pure)
application/     ports.ts · services/{vocabulary,user-vocabulary}-service.ts
infrastructure/  mappers.ts · repositories.ts · container.ts
Presentation:    src/app/api/v1/** · src/app/(dashboard)/{vocabulary,review,progress}/**
                 src/components/vocabulary/** (Flashcard/Quiz sessions, Add button)
```

Reuses shared `CefrLevel`/`Tag` and the shared `DomainError` (extracted to
`src/lib/errors.ts`). SRS/quiz are pure functions (clock injected) → unit-testable.

## 6. Key decisions

[DECISIONS.md](../docs/DECISIONS.md) D-0017…D-0021: vocabulary as its own module;
deterministic SM-2-lite SRS (no AI); shared error hierarchy; client-graded practice quiz
(no answer keys leaked); seeded A1 corpus is product content.

## 7. Verification

| Check       | Command                | Result                                   |
| ----------- | ---------------------- | ---------------------------------------- |
| Type safety | `npm run typecheck`    | ✅ 0 errors                              |
| Lint        | `npm run lint`         | ✅ clean                                 |
| Format      | `npm run format:check` | ✅ clean                                 |
| Build       | `npm run build`        | ✅ 6 vocabulary API routes + 6 UI routes |
| Prisma      | `prisma validate`      | ✅ valid; client generated (39 tables)   |

Not run here (no DB): `prisma migrate`, `prisma:seed`, and the live learn loop —
Sprint 4.2's first tasks.

## 8. Remaining work (→ Sprint 4.2)

Run migrations + seed on Postgres and verify the loop; add **Vitest** for the SRS
scheduler, quiz generator, and services; add audio/images and deck/tag browsing; UX +
accessibility polish. See [NEXT_TASK.md](../docs/NEXT_TASK.md).
