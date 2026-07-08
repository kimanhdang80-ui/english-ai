# Vocabulary Module — Database Spec

> Logical data model for the Vocabulary module. **No SQL.** Mirrors the implemented
> Prisma schema (Sprint 4.1) — this spec must not diverge from it. Conventions: UUID
> primary keys; `snake_case` table/column names; every table has audit timestamps where
> noted; soft delete (`deleted_at`) on the content root. See
> [DATABASE.md](../../docs/DATABASE.md) §3.3 and [DECISIONS.md](../../docs/DECISIONS.md) D-0017…D-0021.

Enumerations used:

- **PartOfSpeech**: noun, verb, adjective, adverb, pronoun, preposition, conjunction, determiner, interjection, phrase
- **VocabularyStatus** (learner state): new, learning, known, mastered
- **ReviewRating**: again, hard, good, easy
- **Accent**: us, uk
- **ContentStatus** (content lifecycle): draft, published, archived

---

## 1. Vocabulary

**Description:** A headword entry (the corpus unit). Owns all content children.

| Field          | Type          | Notes                       |
| -------------- | ------------- | --------------------------- |
| id             | UUID          | PK                          |
| word           | String        | display headword            |
| slug           | String        | **unique**, url-safe key    |
| lemma          | String?       | base form (optional)        |
| cefr_level_id  | UUID?         | FK → cefr_levels            |
| frequency_rank | Int?          | ordering / difficulty proxy |
| status         | ContentStatus | default `published`         |
| created_at     | DateTime      |                             |
| updated_at     | DateTime      |                             |
| deleted_at     | DateTime?     | soft delete                 |

**Relations:** 1─* meanings, examples, pronunciations, audios, images; _─_ tags (via `vocabulary_tags`); 1─* user_vocabulary.
**Indexes:** unique(`slug`); (`cefr_level_id`); (`status`); (`word`).
**Constraints:** `slug` unique; reads exclude `deleted_at IS NOT NULL` and (for the public catalog) `status <> 'published'`.

---

## 2. VocabularyMeaning

**Description:** One sense of a word (definition + part of speech + translation).

| Field          | Type         | Notes                                     |
| -------------- | ------------ | ----------------------------------------- |
| id             | UUID         | PK                                        |
| vocabulary_id  | UUID         | FK → vocabularies (**onDelete: Cascade**) |
| part_of_speech | PartOfSpeech | enum                                      |
| definition     | String       | plain-English definition                  |
| translation    | String?      | learner's native language (e.g. `vi`)     |
| sort_order     | Int          | default 0                                 |

**Relations:** _─1 vocabulary; 1─_ examples (a meaning may have examples).
**Indexes:** (`vocabulary_id`, `sort_order`).
**Constraints:** cascade delete with parent.

---

## 3. VocabularyExample

**Description:** An example sentence, optionally tied to a specific meaning.

| Field         | Type    | Notes                                            |
| ------------- | ------- | ------------------------------------------------ |
| id            | UUID    | PK                                               |
| vocabulary_id | UUID    | FK → vocabularies (**Cascade**)                  |
| meaning_id    | UUID?   | FK → vocabulary_meanings (**onDelete: SetNull**) |
| text          | String  | the example sentence                             |
| translation   | String? | optional native translation                      |
| sort_order    | Int     | default 0                                        |

**Relations:** *─1 vocabulary; *─1 meaning (nullable).
**Indexes:** (`vocabulary_id`, `sort_order`).
**Constraints:** deleting a meaning nulls `meaning_id` (keeps the example on the word).

---

## 4. VocabularyPronunciation

> Present in the implemented schema; provides IPA shown on the flashcard/detail.
> (Listed here for completeness even though the sprint brief grouped IPA under the word.)

**Description:** IPA transcription for a word, per accent.

| Field         | Type    | Notes                           |
| ------------- | ------- | ------------------------------- |
| id            | UUID    | PK                              |
| vocabulary_id | UUID    | FK → vocabularies (**Cascade**) |
| ipa           | String  | IPA string                      |
| accent        | Accent  | default `us`                    |
| is_primary    | Boolean | default false                   |

**Relations:** *─1 vocabulary.
**Indexes:** (`vocabulary_id`).
**Constraints:** the UI treats the `is_primary` (or first) row as canonical.

---

## 5. VocabularyAudio

**Description:** An audio clip URL for a word (pronunciation playback).

| Field         | Type     | Notes                           |
| ------------- | -------- | ------------------------------- |
| id            | UUID     | PK                              |
| vocabulary_id | UUID     | FK → vocabularies (**Cascade**) |
| url           | String   | audio resource URL              |
| accent        | Accent?  | optional                        |
| created_at    | DateTime |                                 |

**Relations:** *─1 vocabulary.
**Indexes:** (`vocabulary_id`).
**Constraints:** none beyond FK; absence → UI hides the play control.

---

## 6. VocabularyImage

**Description:** An illustrative image URL for a word.

| Field         | Type    | Notes                           |
| ------------- | ------- | ------------------------------- |
| id            | UUID    | PK                              |
| vocabulary_id | UUID    | FK → vocabularies (**Cascade**) |
| url           | String  | image resource URL              |
| alt           | String? | accessibility alt text          |
| is_primary    | Boolean | default false                   |

**Relations:** *─1 vocabulary.
**Indexes:** (`vocabulary_id`).
**Constraints:** absence → UI shows a "No image" placeholder.

---

## 7. VocabularyTag

**Description:** Join between a word and a shared `Tag` (topic/theme label). Enables
themed browsing (Sprint 4.2 UI). Reuses the Learning Engine `tags` table.

| Field         | Type | Notes                                        |
| ------------- | ---- | -------------------------------------------- |
| vocabulary_id | UUID | FK → vocabularies (**Cascade**) — part of PK |
| tag_id        | UUID | FK → tags (**Cascade**) — part of PK         |

**Relations:** *─1 vocabulary; *─1 tag.
**Indexes:** composite **PK** (`vocabulary_id`, `tag_id`); (`tag_id`).
**Constraints:** composite PK prevents duplicate tagging.

---

## 8. UserVocabulary

**Description:** A learner's relationship to a word **and** its spaced-repetition state.
This is the core learner-owned record.

| Field            | Type             | Notes                                   |
| ---------------- | ---------------- | --------------------------------------- |
| id               | UUID             | PK                                      |
| user_id          | UUID             | FK → profiles (**Cascade**)             |
| vocabulary_id    | UUID             | FK → vocabularies (**Cascade**)         |
| status           | VocabularyStatus | default `new`                           |
| is_favorite      | Boolean          | default false                           |
| ease             | Float            | default 2.5 (SM-2 ease factor, min 1.3) |
| interval_days    | Int              | default 0                               |
| repetitions      | Int              | default 0                               |
| lapses           | Int              | default 0                               |
| due_at           | DateTime         | default now (initially due immediately) |
| last_reviewed_at | DateTime?        | null until first review                 |
| created_at       | DateTime         |                                         |
| updated_at       | DateTime         |                                         |

**Relations:** *─1 profile; _─1 vocabulary; 1─_ review_history.
**Indexes:** **unique**(`user_id`, `vocabulary_id`); (`user_id`, `status`); (`user_id`, `due_at`).
**Constraints:** one row per (learner, word) — enforces idempotent "add". Deleting the
account or the word cascades. `ease ≥ 1.3` and `interval_days ≥ 0`, `repetitions ≥ 0`
(enforced by the scheduler, see [validation.md](./validation.md)).

---

## 9. ReviewHistory

**Description:** Append-only log of each review (audit + analytics + potential SRS replay).

| Field              | Type         | Notes                              |
| ------------------ | ------------ | ---------------------------------- |
| id                 | UUID         | PK                                 |
| user_vocabulary_id | UUID         | FK → user_vocabulary (**Cascade**) |
| user_id            | UUID         | FK → profiles (**Cascade**)        |
| rating             | ReviewRating | enum                               |
| prev_interval_days | Int          | interval before this review        |
| new_interval_days  | Int          | interval after                     |
| prev_ease          | Float        | ease before                        |
| new_ease           | Float        | ease after                         |
| reviewed_at        | DateTime     | default now                        |

**Relations:** *─1 user_vocabulary; *─1 profile.
**Indexes:** (`user_vocabulary_id`); (`user_id`, `reviewed_at`).
**Constraints:** never updated/deleted in normal operation (append-only). Written in the
**same transaction** as the `user_vocabulary` update.

---

## 10. Relationship map

```
CefrLevel 1─* Vocabulary 1─* VocabularyMeaning 1─* VocabularyExample
                        1─* VocabularyPronunciation
                        1─* VocabularyAudio
                        1─* VocabularyImage
                        *─* Tag (via VocabularyTag)
                        1─* UserVocabulary *─1 Profile
                                 1─* ReviewHistory
```

## 11. Integrity & lifecycle rules

- **Soft delete** only on `vocabularies` (`deleted_at`); children are hard-deleted by cascade.
- **Idempotent add**: uniqueness on (`user_id`, `vocabulary_id`).
- **Review atomicity**: updating `user_vocabulary` SRS fields and inserting `review_history` occur together.
- **Ownership**: all `user_vocabulary` / `review_history` access is scoped by `user_id`.
- This spec introduces **no schema change** (Sprint 5.1 is documentation only).
