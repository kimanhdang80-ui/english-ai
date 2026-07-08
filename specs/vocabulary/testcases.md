# Vocabulary Module — Test Cases

> 30 functional + 20 edge cases. Each references validation rules (V-##, see
> [validation.md](./validation.md)) where relevant. Format: **ID · Preconditions ·
> Steps · Expected**. "Learner" = authenticated user unless stated.

Legend: **FC** = functional case, **EC** = edge case.

---

## A. Functional test cases (30)

### Catalog & search

| ID    | Preconditions       | Steps                                  | Expected                                                                       |
| ----- | ------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| FC-01 | Corpus seeded       | GET `/vocabularies`                    | 200; list of published words; `meta.total > 0`; ordered by frequency then word |
| FC-02 | —                   | GET `/vocabularies?pageSize=10&page=2` | 200; ≤10 items; `meta.page=2,pageSize=10`                                      |
| FC-03 | Word "apple" exists | GET `/vocabularies?q=app`              | 200; results include "apple" (case-insensitive substring)                      |
| FC-04 | —                   | GET `/vocabularies?q=zzzzz`            | 200; empty `data`; `total=0`                                                   |
| FC-05 | Valid word id       | GET `/vocabularies/{id}`               | 200; detail with meanings/examples/pronunciations/tags                         |
| FC-06 | —                   | GET `/vocabularies/{unknown-uuid}`     | 404 `NOT_FOUND`                                                                |
| FC-07 | Word has ≥1 meaning | Inspect detail                         | `primaryPos`/first meaning present; children ordered by sort_order             |

### Add to learning

| ID    | Preconditions             | Steps                             | Expected                                                  |
| ----- | ------------------------- | --------------------------------- | --------------------------------------------------------- |
| FC-08 | Learner signed in; word W | POST `/user-vocabulary {W}`       | 201; state `status=new`, `dueAt≈now`, defaults (ease 2.5) |
| FC-09 | W already added           | POST `/user-vocabulary {W}` again | 201/OK; **same** entry returned; no duplicate row (V-14)  |
| FC-10 | Signed in                 | POST with valid W                 | Word now appears in study set / today queue               |
| FC-11 | UI list                   | Click "Add to learning"           | Button → "Added ✓" disabled (V-38)                        |

### Review / SRS

| ID    | Preconditions                       | Steps                                      | Expected                                                                                     |
| ----- | ----------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| FC-12 | Entry E is `new`, due               | PATCH `/user-vocabulary/E {rating:"good"}` | 200; `repetitions=1`, `intervalDays=1`, `dueAt=now+1d`, `status=learning` (V-22)             |
| FC-13 | Entry E has interval 1, rep 1       | PATCH `{rating:"good"}`                    | `repetitions=2`, `intervalDays=3`                                                            |
| FC-14 | Entry E rep≥2, interval 3, ease 2.5 | PATCH `{rating:"good"}`                    | `intervalDays=round(3×2.5)=8`, `status=known` (≥7)                                           |
| FC-15 | Entry E interval>0                  | PATCH `{rating:"again"}`                   | `intervalDays=0`, `repetitions=0`, `lapses+1`, `ease−0.2`, `status=learning`, due now (V-21) |
| FC-16 | Any review                          | After PATCH with rating                    | Exactly one `ReviewHistory` row appended (V-24)                                              |
| FC-17 | Entry reaches interval ≥30          | Sequence of good reviews                   | `status=mastered`; drops out of today queue (V-23, V-28)                                     |
| FC-18 | Signed in                           | PATCH `{isFavorite:true}`                  | 200; `isFavorite=true`                                                                       |
| FC-19 | Favorite true                       | PATCH `{isFavorite:false}`                 | 200; `isFavorite=false`                                                                      |
| FC-20 | Signed in                           | PATCH `{rating:"good", isFavorite:true}`   | 200; both applied; returned state reflects update                                            |

### Today's review

| ID    | Preconditions                    | Steps                               | Expected                                                   |
| ----- | -------------------------------- | ----------------------------------- | ---------------------------------------------------------- |
| FC-21 | Learner has due words            | GET `/reviews/today`                | 200; only due, non-mastered cards; ordered by dueAt (V-27) |
| FC-22 | No words due                     | GET `/reviews/today`                | 200; empty array                                           |
| FC-23 | Card graded "good" (interval 1d) | GET `/reviews/today` again same day | That card no longer due                                    |

### Quiz

| ID    | Preconditions      | Steps                   | Expected                                   |
| ----- | ------------------ | ----------------------- | ------------------------------------------ |
| FC-24 | ≥4 words           | Open `/vocabulary/quiz` | Questions generated across the 4 kinds     |
| FC-25 | MC question        | Choose correct option   | Marked correct; score +1                   |
| FC-26 | Fill-blank "apple" | Type "Apple "           | Correct (case-insensitive, trimmed) (V-32) |
| FC-27 | True/False         | Answer                  | Correct/incorrect shown; Next enabled      |
| FC-28 | Finish quiz        | Complete all            | Summary "Score X / N"                      |

### Progress

| ID    | Preconditions             | Steps                        | Expected                                                           |
| ----- | ------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| FC-29 | Learner with some entries | GET `/user-vocabulary/stats` | totalWords, studying, learned, dueToday, completionRate consistent |
| FC-30 | 4 learned of 60           | Open `/progress`             | Bar ≈ 7%; stat cards match stats payload                           |

---

## B. Edge cases (20)

| ID    | Scenario              | Steps                                           | Expected                                                           |
| ----- | --------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| EC-01 | Unauth add            | POST `/user-vocabulary` signed out              | 401 `UNAUTHENTICATED` (V-11)                                       |
| EC-02 | Unauth review page    | Visit `/review` signed out                      | Redirect to `/login?redirectTo=/review`                            |
| EC-03 | Foreign entry         | PATCH another user's `user_vocabulary` id       | 404 `NOT_FOUND` (V-12)                                             |
| EC-04 | Review before add     | PATCH a `user_vocabulary` id that doesn't exist | 404 (V-18)                                                         |
| EC-05 | Empty PATCH body      | PATCH `{}`                                      | 400 `VALIDATION_ERROR` (V-07)                                      |
| EC-06 | Bad rating            | PATCH `{rating:"perfect"}`                      | 400 (V-08)                                                         |
| EC-07 | Non-boolean favorite  | PATCH `{isFavorite:"yes"}`                      | 400 (V-09)                                                         |
| EC-08 | Missing vocabularyId  | POST `{}`                                       | 400 (V-06)                                                         |
| EC-09 | Non-uuid id           | GET `/vocabularies/not-a-uuid`                  | 404 (V-05)                                                         |
| EC-10 | Huge pageSize         | GET `?pageSize=100000`                          | Clamped to 100 (V-02)                                              |
| EC-11 | Zero/negative page    | GET `?page=0` / `?page=-3`                      | Coerced to page 1 (V-01)                                           |
| EC-12 | Whitespace query      | GET `?q=%20%20`                                 | Treated as no filter (V-03)                                        |
| EC-13 | Ease floor            | Many `again` reviews                            | `ease` never < 1.3 (V-19)                                          |
| EC-14 | Interval non-negative | `again` from interval 0                         | `intervalDays=0`, never negative (V-20)                            |
| EC-15 | Idempotent add race   | Two near-simultaneous adds of W                 | One row total; both return the same entry (V-14)                   |
| EC-16 | Soft-deleted word     | Word W soft-deleted                             | Excluded from list; detail → 404 (V-15, V-16)                      |
| EC-17 | Quiz with 3 words     | Open quiz                                       | Empty quiz state "not enough words" (V-30)                         |
| EC-18 | Empty corpus stats    | New DB, no words                                | `completionRate=0` (no divide-by-zero) (V-36)                      |
| EC-19 | Mastered in queue     | Word mastered                                   | Not in `/reviews/today`, still counted as learned (V-28, V-35)     |
| EC-20 | Grade double-click    | Rapidly tap "Know" twice                        | Only one grade applied (buttons disabled while busy) (V-40)        |
| EC-21 | Favorite failure      | Toggle favorite; server errors                  | Optimistic UI reverts (V-39)                                       |
| EC-22 | Malformed JSON        | POST with invalid JSON body                     | 400 `VALIDATION_ERROR` (V-10)                                      |
| EC-23 | Word with no examples | Open detail                                     | Examples card hidden; no error                                     |
| EC-24 | Word with no image    | Flashcard back                                  | "No image" placeholder shown                                       |
| EC-25 | Session cap           | Learner has 200 due                             | Today returns up to the cap (default 50); rest next session (V-29) |

> Note: 25 edge cases are listed (≥ the required 20) to cover auth, ownership, SRS bounds,
> idempotency, soft delete, quiz threshold, and UI resilience.
