# Vocabulary Module — API Spec

> Endpoint contracts. Base path **`/api/v1`**. JSON only. Standard response envelope
> per [API.md](../../docs/API.md) §1.1. Auth is cookie-based (Supabase SSR); learner
> endpoints require an authenticated user. Field casing is `camelCase`.

**Envelope recap**

```jsonc
// item        { "data": <object>,  "meta": { "requestId": "…" } }
// list        { "data": [ … ],     "meta": { "page":1,"pageSize":20,"total":N,"requestId":"…" } }
// error       { "error": { "code":"…","message":"…","details":?,"requestId":"…" } }
```

**Error codes → HTTP:** `VALIDATION_ERROR`→400, `UNAUTHENTICATED`→401, `NOT_FOUND`→404,
`CONFLICT`→409, `NOT_IMPLEMENTED`→501, `INTERNAL`→500.

**Permission model:** catalog reads (`/vocabularies*`) are open to any user (public content).
Learner endpoints (`/user-vocabulary*`, `/reviews/today`) require **authentication**;
authorization is **ownership-based** (a learner may only touch their own rows) — no special
RBAC permission is required beyond being a signed-in learner ([DATABASE.md](../../docs/DATABASE.md), ADR-0002).

---

## 1. GET /vocabularies

List / search the published corpus.

- **Auth:** none required.
- **Query params:**
  | Param         | Type       | Default | Notes                                      |
  | ------------- | ---------- | ------- | ------------------------------------------ |
  | `q`           | string     | —       | case-insensitive substring match on `word` |
  | `cefrLevelId` | uuid       | —       | filter by CEFR level                       |
  | `tag`         | string     | —       | filter by tag **slug**                     |
  | `page`        | int ≥ 1    | 1       |                                            |
  | `pageSize`    | int 1..100 | 20      | clamped                                    |
- **Response 200 (list):** `data` = array of **VocabularySummary**:
  ```jsonc
  {
    "id": "…",
    "word": "apple",
    "slug": "apple",
    "primaryPos": "noun",
    "primaryDefinition": "a round fruit…",
    "ipa": "/ˈæpəl/",
  }
  ```
  `meta` includes `page`, `pageSize`, `total`.
- **Validation:** `page`/`pageSize` coerced to safe ranges; unknown params ignored.
- **Errors:** `500 INTERNAL` on unexpected failure.
- **Rules:** only `status = published` and not soft-deleted; ordered by `frequency_rank asc, word asc`.

---

## 2. GET /vocabularies/{id}

Full word detail.

- **Auth:** none required.
- **Path:** `id` (uuid).
- **Response 200 (item):** **Vocabulary** detail:
  ```jsonc
  {
    "id": "…",
    "word": "apple",
    "slug": "apple",
    "lemma": null,
    "cefrLevelId": "…",
    "frequencyRank": 18,
    "meanings": [
      {
        "id": "…",
        "partOfSpeech": "noun",
        "definition": "…",
        "translation": "quả táo",
      },
    ],
    "examples": [
      {
        "id": "…",
        "meaningId": null,
        "text": "She eats an apple…",
        "translation": null,
      },
    ],
    "pronunciations": [
      { "id": "…", "ipa": "/ˈæpəl/", "accent": "us", "isPrimary": true },
    ],
    "audios": [{ "id": "…", "url": "…", "accent": "us" }],
    "images": [{ "id": "…", "url": "…", "alt": "apple", "isPrimary": true }],
    "tags": ["food"],
  }
  ```
- **Validation:** `id` must be a valid uuid (else treated as not found).
- **Errors:** `404 NOT_FOUND` if missing or soft-deleted; `500 INTERNAL`.
- **Rules:** children ordered by `sort_order` / `is_primary`.

---

## 3. GET /reviews/today

The learner's due review cards.

- **Auth:** **required** (401 otherwise).
- **Query params:** none (server uses "now").
- **Response 200 (item):** `data` = array of **ReviewCard**:
  ```jsonc
  { "vocabulary": <Vocabulary detail>,
    "state": { "id":"…","vocabularyId":"…","status":"learning","isFavorite":false,
               "ease":2.5,"intervalDays":0,"repetitions":0,
               "dueAt":"2026-07-01T…Z","lastReviewedAt":null } }
  ```
- **Selection rule:** `user_vocabulary` where `user_id = me` AND `due_at ≤ now` AND
  `status ≠ mastered`, ordered by `due_at asc`, limited (default 50).
- **Errors:** `401 UNAUTHENTICATED`; `500 INTERNAL`.

---

## 4. POST /user-vocabulary

Add a word to the learner's set (start learning). **Idempotent.**

- **Auth:** **required**.
- **Request body:**
  ```jsonc
  { "vocabularyId": "<uuid>" }
  ```
- **Response 201 (item):** **UserVocabularyState** (as in `state` above). If the entry
  already exists, returns the existing state (still 201/OK, no duplicate created).
- **Validation:**
  - `vocabularyId` required, valid uuid → else `400 VALIDATION_ERROR`.
  - referenced word should exist (FK) → violation surfaces as `500`/`400` (see edge cases).
- **Errors:** `400 VALIDATION_ERROR`; `401 UNAUTHENTICATED`; `500 INTERNAL`.
- **Rules:** creates `user_vocabulary` with `status=new`, `due_at=now` (immediately due),
  default SRS state. Uniqueness (`user_id`,`vocabularyId`) guarantees idempotency.

---

## 5. PATCH /user-vocabulary/{id}

Apply a **review grade** (SRS) and/or toggle **favorite**.

- **Auth:** **required**; **ownership** enforced (the entry must belong to the caller).
- **Path:** `id` = `user_vocabulary.id` (uuid).
- **Request body (at least one field):**
  ```jsonc
  { "rating": "again|hard|good|easy", "isFavorite": true }
  ```
- **Response 200 (item):** the updated **UserVocabularyState**.
- **Behavior:**
  - If `rating` present → run the SRS scheduler with "now", persist new
    `ease/intervalDays/repetitions/lapses/dueAt/status/lastReviewedAt`, and append a
    `review_history` row (same transaction).
  - If `isFavorite` present → set the flag.
  - Both may be supplied; the returned state reflects the last applied change.
- **Validation:**
  - body must include `rating` and/or `isFavorite`, else `400 VALIDATION_ERROR`.
  - `rating` ∈ enum; `isFavorite` boolean.
- **Errors:** `400 VALIDATION_ERROR`; `401 UNAUTHENTICATED`; `404 NOT_FOUND` (not owned /
  missing); `500 INTERNAL`.

---

## 6. GET /user-vocabulary/stats (supporting)

Progress summary for the Progress screen.

- **Auth:** **required**.
- **Response 200 (item):**
  ```jsonc
  {
    "totalWords": 60,
    "studying": 12,
    "learned": 4,
    "dueToday": 3,
    "completionRate": 0.066,
  }
  ```
  - `totalWords` = published corpus size; `studying` = entries in the learner's set;
    `learned` = status ∈ {known, mastered}; `dueToday` = due & not mastered;
    `completionRate` = `learned / totalWords` (0 when corpus empty).
- **Errors:** `401 UNAUTHENTICATED`; `500 INTERNAL`.

---

## 7. Cross-cutting

- **Idempotency:** POST add is naturally idempotent (unique constraint).
- **Ownership:** every learner row is filtered by `user_id`; a mismatched `id` returns 404, never another user's data.
- **No answer leakage:** the catalog/detail endpoints never expose grading keys (quiz grading is client-side, D-0020).
- **Determinism:** SRS scheduling is server-side and deterministic; the same rating on the same state yields the same next state.
- **Versioning:** breaking changes ship under `/api/v2`.
