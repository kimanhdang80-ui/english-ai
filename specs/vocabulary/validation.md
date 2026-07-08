# Vocabulary Module — Validation & Business Rules

> Every input validation and invariant the module must enforce. Grouped by layer.
> IDs (V-##) are referenced by [testcases.md](./testcases.md) and
> [acceptance-criteria.md](./acceptance-criteria.md).

---

## 1. Input validation (API boundary)

| ID   | Rule                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| V-01 | `GET /vocabularies`: `page` coerced to integer ≥ 1 (default 1).                                            |
| V-02 | `GET /vocabularies`: `pageSize` coerced to 1..100 (default 20); values outside are clamped.                |
| V-03 | `GET /vocabularies`: `q` is trimmed; empty `q` is treated as "no filter".                                  |
| V-04 | `GET /vocabularies`: `tag` filters by tag **slug** (exact). Unknown tag → empty result, not error.         |
| V-05 | `GET /vocabularies/{id}`: non-uuid or unknown `id` → `404 NOT_FOUND` (no stack/detail leaked).             |
| V-06 | `POST /user-vocabulary`: `vocabularyId` is **required** and must be a valid uuid → else `400`.             |
| V-07 | `PATCH /user-vocabulary/{id}`: body must contain **at least one** of `rating` / `isFavorite` → else `400`. |
| V-08 | `PATCH …`: `rating` ∈ {again, hard, good, easy}; anything else → `400`.                                    |
| V-09 | `PATCH …`: `isFavorite` must be boolean → else `400`.                                                      |
| V-10 | All request bodies are parsed defensively; malformed JSON → `400 VALIDATION_ERROR`.                        |

## 2. Authentication & authorization

| ID   | Rule                                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| V-11 | `POST/PATCH /user-vocabulary*`, `GET /reviews/today`, `GET /user-vocabulary/stats` require an authenticated user → else `401 UNAUTHENTICATED`. |
| V-12 | A learner may only read/modify **their own** `user_vocabulary` rows. A foreign/unknown `id` → `404 NOT_FOUND` (never another user's data).     |
| V-13 | Catalog endpoints (`/vocabularies*`) never require ownership and never expose learner data.                                                    |

## 3. Data & uniqueness invariants

| ID   | Rule                                                                                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-14 | **No duplicate learner entry:** at most one `user_vocabulary` per (`user_id`, `vocabulary_id`). "Add" is idempotent — a second add returns the existing entry, not a new row. |
| V-15 | Only **published**, non-soft-deleted words appear in the catalog list.                                                                                                        |
| V-16 | Soft-deleted words are excluded from list and detail (detail → 404).                                                                                                          |
| V-17 | Adding a word that does not exist (bad FK) must not create an orphan row (fails cleanly).                                                                                     |

## 4. SRS / review rules

| ID   | Rule                                                                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V-18 | **Cannot review a word not in the learner's set.** Review targets a `user_vocabulary.id`; if it doesn't exist for this user → `404`. (You must "add" before you can review.)   |
| V-19 | `ease` never drops below **1.3** (floor).                                                                                                                                      |
| V-20 | `interval_days` is always **≥ 0**; `repetitions` and `lapses` are **≥ 0** (no negative values).                                                                                |
| V-21 | Rating `again` → `interval_days = 0`, `repetitions = 0`, `lapses += 1`, `ease −= 0.2` (floored), status → `learning`, `due_at = now`.                                          |
| V-22 | Rating `good` → `repetitions += 1`; interval = 1 (rep 1), 3 (rep 2), else `round(interval × ease)`; `due_at = now + interval days`.                                            |
| V-23 | Status derives **only** from the new interval: `< 7d` learning, `≥ 7d` known, `≥ 30d` mastered.                                                                                |
| V-24 | Every applied rating writes exactly **one** `review_history` row, in the same transaction as the `user_vocabulary` update (no update without a log; no log without an update). |
| V-25 | Scheduling is **deterministic**: same (state, rating, now) ⇒ same result (no randomness).                                                                                      |
| V-26 | `last_reviewed_at` is set to "now" on every review; unset (null) until the first review.                                                                                       |

## 5. Review-queue rules

| ID   | Rule                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| V-27 | "Today" includes only entries with `due_at ≤ now` **and** `status ≠ mastered`.                               |
| V-28 | Mastered words never appear in the due queue (but still count toward "learned").                             |
| V-29 | The queue is ordered by `due_at asc` and capped (default 50) — the cap is a UI/session limit, not data loss. |

## 6. Quiz rules

| ID   | Rule                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| V-30 | Quiz generation requires **≥ 4** usable words (with a definition); otherwise the quiz is empty and the UI shows the "not enough words" state. |
| V-31 | Quiz grading is **client-side** against the generated key; the server never returns correct answers for catalog content (no answer leakage).  |
| V-32 | Fill-in-the-blank grading is case-insensitive and trims whitespace.                                                                           |
| V-33 | A question cannot be scored twice (answering locks the question until "Next").                                                                |

## 7. Progress / stats rules

| ID   | Rule                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------- |
| V-34 | `totalWords` counts only published, non-deleted words.                                             |
| V-35 | `learned` = entries with status ∈ {known, mastered}.                                               |
| V-36 | `completionRate` = `learned / totalWords`, and is **0** when `totalWords = 0` (no divide-by-zero). |
| V-37 | `dueToday` uses the same predicate as the review queue (`due_at ≤ now ∧ status ≠ mastered`).       |

## 8. UI-level validation

| ID   | Rule                                                                                     |
| ---- | ---------------------------------------------------------------------------------------- |
| V-38 | "Add to learning" disables after success ("Added ✓") to prevent rapid duplicate submits. |
| V-39 | Favorite toggle is optimistic and **reverts** on failure.                                |
| V-40 | Grade buttons are disabled while a grade request is in flight (no double-grade).         |
| V-41 | Empty/loading/error states are always rendered for data views (never a blank screen).    |
