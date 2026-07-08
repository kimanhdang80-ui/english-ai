# DATABASE.md — English AI

> The authoritative logical data model. **No SQL/DDL yet** — this defines entities,
> keys, relationships, indexes, and expansion strategy. Prisma schema will be
> generated from this design in Sprint 1–2.

---

## 0. Conventions

- **Engine:** PostgreSQL 16 + `pgvector`.
- **Primary keys:** `id UUID` (UUID v7, time-sortable). Surrogate keys everywhere.
- **Naming:** tables `snake_case` **plural**; columns `snake_case`; FKs `<entity>_id`.
- **Timestamps:** every table has `created_at`, `updated_at`. Soft delete via `deleted_at` (nullable) on user-facing content.
- **Enums:** stored as Postgres enums or lookup tables where values evolve.
- **Money:** integer minor units + `currency`. **Never floats for money.**
- **Multi-tenancy-ready:** append-only analytical tables carry `occurred_at` for partitioning.

---

## 1. Entity Domains (overview)

1. Identity & Access
2. Content & Curriculum
3. Vocabulary
4. Grammar
5. Listening & Reading (comprehension)
6. Speaking & Pronunciation
7. Conversation & AI Teacher
8. Spaced Repetition (SRS)
9. Learning Plan & Adaptive Engine
10. Progress & Gamification
11. Exams (TOEIC / IELTS) & Tracks
12. Media & AI Operations
13. Billing
14. Notifications & Analytics

---

## 2. ERD (logical, text form)

```
users 1─1 user_profiles
users 1─* auth_accounts
users 1─* refresh_tokens
users *─* roles (via user_roles) ; roles *─* permissions (via role_permissions)

languages 1─* courses
courses 1─* course_units
course_units 1─* lessons
lessons 1─* lesson_activities
skills 1─* lesson_activities            (activity belongs to a skill type)
cefr_levels 1─* courses / lessons       (level tagging)

vocabulary_decks 1─* vocabulary_words
vocabulary_words 1─* word_senses
vocabulary_words 1─* example_sentences
users *─* vocabulary_words (via user_vocabulary → SRS state)

grammar_topics 1─* grammar_rules
grammar_topics 1─* grammar_exercises

listening_tracks 1─* comprehension_questions
reading_passages 1─* comprehension_questions
comprehension_questions 1─* answer_options
users 1─* user_question_attempts

speaking_prompts 1─* speaking_attempts (per user)
speaking_attempts 1─* pronunciation_scores
speaking_attempts 1─* phoneme_scores

conversation_scenarios 1─* conversations
users 1─* conversations
conversations 1─* conversation_messages
users 1─* ai_teacher_sessions 1─* ai_feedback

srs_cards *─1 users ; srs_cards 1─* srs_reviews
(srs_cards polymorphic → vocabulary_word | grammar_rule | phrase)

users 1─* daily_plans 1─* daily_plan_items
users 1─1 weakness_profiles (JSON per skill/topic) 1─* weakness_signals
users 1─1 adaptive_states

users 1─* skill_progress
users 1─* xp_transactions
users 1─1 streaks
achievements *─* users (via user_achievements)
leaderboards 1─* leaderboard_entries

exam_tests 1─* exam_sections 1─* exam_questions 1─* exam_options
users 1─* exam_attempts 1─* exam_answers ; exam_attempts 1─1 exam_scores

media_assets referenced by (lessons, tracks, words, tts renders)
ai_generation_jobs, ai_usage_logs, prompt_templates
plans 1─* subscriptions ; users 1─* subscriptions 1─* payments
users 1─* notifications ; users 1─* devices
analytics_events (append-only, partitioned by occurred_at)
```

---

## 3. Table Specifications

> Format: **table** — purpose · key columns · PK · FKs · indexes.

### 3.1 Identity & Access — **IMPLEMENTED (Sprint 2.1)**

> **Supabase-Auth-centric** ([ADR-0002](./adr/ADR-0002.md)). Supabase owns the `auth`
> schema (`auth.users`, identities, tokens, email verification, password hashing). Our
> `public` schema owns application identity + RBAC. **`profiles.id == auth.users.id`**
> (no cross-schema FK; synced by a Supabase trigger/webhook). There is no app-side
> `password_hash` or OAuth table. Elsewhere in this document, references to a "user" map
> to **`profiles`** as the owning identity.

**profiles** — application identity/profile (id = Supabase auth uid).
Cols: `id`(uuid, = auth uid), `email` (unique, nullable/mirrored), `display_name`, `avatar_url`, `status` (enum: active/suspended/deleted), `is_kid`, `native_language_id`(FK→languages), `learning_goal` (enum), `current_cefr`, `target_cefr`, `daily_minutes_goal`, `timezone`, `ui_locale`, `onboarded_at`, `last_seen_at`, `created_at`, `updated_at`, `deleted_at`.
PK `id`. Index: unique(`email`), (`status`), (`native_language_id`).

**roles** — a named bundle of permissions (data, not code).
Cols: `id`, `code` (unique: admin/teacher/content_manager/student), `name`, `description`, `is_system`, `created_at`, `updated_at`. PK `id`.

**permissions** — atomic capability `<resource>.<action>`.
Cols: `id`, `code` (unique, e.g. `content.publish`), `resource`, `action`, `description`, `created_at`. PK `id`. Index: (`resource`).

**role_permissions** — join role→permission.
Cols: `id`, `role_id`(FK), `permission_id`(FK), `created_at`. PK `id`. Index: unique(`role_id`,`permission_id`), (`permission_id`).

**user_roles** — join profile→role.
Cols: `id`, `user_id`(FK→profiles), `role_id`(FK→roles), `assigned_by`(uuid, nullable), `created_at`. PK `id`. Index: unique(`user_id`,`role_id`), (`role_id`).

**user_settings** — per-user app preferences.
Cols: `id`, `user_id`(FK→profiles, unique), `theme` (light/dark/system), `locale`, `timezone`, `reduced_motion`, `email_notifications`, `push_notifications`, `marketing_emails`, `created_at`, `updated_at`. PK `id`.

**user_devices** — authenticated devices/browsers (push + session context).
Cols: `id`, `user_id`(FK→profiles), `platform` (enum: web/ios/android), `device_name`, `user_agent`, `push_token` (unique), `ip_address`, `last_active_at`, `created_at`. PK `id`. Index: (`user_id`).

**user_sessions** — session mirror for audit + "log out everywhere". Stores a token **hash** + metadata only, never raw Supabase tokens.
Cols: `id`, `user_id`(FK→profiles), `device_id`(FK→user_devices, nullable, SetNull), `refresh_token_hash`, `ip_address`, `user_agent`, `expires_at`, `revoked_at`, `last_used_at`, `created_at`. PK `id`. Index: (`user_id`), (`expires_at`).

**audit_logs** — append-only security trail (partition by `created_at` at scale).
Cols: `id`, `user_id`(FK→profiles, nullable, SetNull), `action` (e.g. `auth.login`), `resource`, `resource_id`, `ip_address`, `user_agent`, `metadata` (JSONB), `created_at`. PK `id`. Index: (`user_id`,`created_at`), (`action`).

**notification_preferences** — granular per-channel, per-category opt-in.
Cols: `id`, `user_id`(FK→profiles), `channel` (enum: email/push/in_app), `category` (reminders/streak/review_due/achievements/system/marketing), `enabled`, `created_at`, `updated_at`. PK `id`. Index: unique(`user_id`,`channel`,`category`), (`user_id`).

_Enums added:_ `DevicePlatform` (web/ios/android), `NotificationChannel` (email/push/in_app). _Retained:_ `UserStatus`, `LearningGoal`, `CourseTrack`.

> **Sprint 1 tables `users`, `user_profiles`, `auth_accounts`, `refresh_tokens` were
> removed** and replaced by the above ([ADR-0002](./adr/ADR-0002.md)). The future-domain
> tables in §3.3–§3.14 that reference a user will FK to `profiles`.

### 3.2 Learning Engine (Content & Curriculum) — **IMPLEMENTED (Sprint 3.1)**

> The **generic, content-type-agnostic** engine used by all lesson kinds (see
> [DECISIONS.md](./DECISIONS.md) D-0009). Content tree:
> **Course → Unit → Lesson → LessonVersion → Activity → Exercise → Question →
> (Choice | Answer)**. Soft delete (`deleted_at`) on Course/Unit/Lesson/LearningPath.

**Reference / taxonomy**

- **languages** — `id`, `code` (ISO 639-1, unique), `name`, `native_name`, `is_ui_supported`.
- **cefr_levels** — `id`, `code` (A1..C2, unique), `rank`, `description`.
- **skills** — `id`, `code` (unique), `name`, `description`, `icon`, `sort_order`.
- **difficulties** — intra-level difficulty (data, not enum): `id`, `code` (unique), `name`, `level` (int), `description`.
- **tags** — reusable labels: `id`, `slug` (unique), `name`, `kind?`, `created_at`.

**Curriculum hierarchy**

- **courses** — `id`, `slug` unique, `title`, `description`, `track` (enum), `status` (enum: draft/published/archived), `language_id`(FK), `cefr_level_id`(FK), `version`, `sort_order`, timestamps, `deleted_at`. Index: (`track`),(`status`),(`cefr_level_id`).
- **units** — `id`, `course_id`(FK, Cascade), `title`, `description`, `status`, `sort_order`, timestamps, `deleted_at`. Index: (`course_id`,`sort_order`),(`status`).
- **lessons** — `id`, `unit_id`(FK, Cascade), `slug` unique, `title`, `summary`, `primary_skill_id`(FK), `cefr_level_id`(FK), `difficulty_id`(FK), `status`, `estimated_minutes`, `xp_reward`, `sort_order`, `is_ai_generated`, `current_version_id`(FK→lesson_versions, unique), timestamps, `deleted_at`. Index: (`unit_id`,`sort_order`),(`primary_skill_id`),(`cefr_level_id`),(`difficulty_id`),(`status`).
- **lesson_versions** — immutable content snapshot: `id`, `lesson_id`(FK, Cascade), `version_number`, `status`, `notes`, `published_at`, timestamps. Unique(`lesson_id`,`version_number`). `lessons.current_version_id` points here.

**Content tree (within a LessonVersion)**

- **activities** — `id`, `lesson_version_id`(FK, Cascade), `type` (enum: intro/teach/practice/quiz/review/assessment), `title`, `instructions`, `sort_order`. Index: (`lesson_version_id`,`sort_order`).
- **exercises** — `id`, `activity_id`(FK, Cascade), `type` (enum: flashcard/multiple_choice/fill_blank/matching/ordering/dictation/speaking/listening/open_response), `prompt`, `difficulty_id`(FK), `config` (JSONB), `sort_order`. Index: (`activity_id`,`sort_order`),(`difficulty_id`).
- **questions** — `id`, `exercise_id`(FK, Cascade), `type` (enum), `prompt`, `explanation`, `difficulty_id`(FK), `metadata` (JSONB), `sort_order`. Index: (`exercise_id`,`sort_order`),(`difficulty_id`).
- **choices** — selectable option: `id`, `question_id`(FK, Cascade), `label`, `content`, `is_correct`, `sort_order`. Index: (`question_id`,`sort_order`).
- **answers** — answer **key** (not user submissions): `id`, `question_id`(FK, Cascade), `value`, `is_primary`, `match_mode` (exact/ci/regex/contains). Index: (`question_id`).

**Sequencing & objectives**

- **lesson_dependencies** — prereq graph: `id`, `lesson_id`(FK), `depends_on_lesson_id`(FK), `type` (prerequisite/recommended). Unique(`lesson_id`,`depends_on_lesson_id`).
- **learning_objectives** — `id`, `code?` unique, `title`, `description`, `skill_id`(FK), `cefr_level_id`(FK). Index: (`skill_id`).
- **learning_paths** — curated route: `id`, `slug` unique, `title`, `description`, `track`, `status`, timestamps, `deleted_at`. Index: (`track`),(`status`).
- **learning_path_steps** — `id`, `path_id`(FK, Cascade), `step_type` (course/lesson/objective), `course_id?`(FK), `lesson_id?`(FK), `objective_id?`(FK), `sort_order`. Index: (`path_id`,`sort_order`).

**Join tables** — **lesson_tags** (`lesson_id`,`tag_id` PK), **lesson_objectives** (`lesson_id`,`objective_id` PK).

_Enums added:_ `ContentStatus`, `ActivityType`, `ExerciseType`, `QuestionType`,
`DependencyType`, `PathStepType`. _Superseded:_ Sprint-1 `course_units`→`units`, and the
single-table `lesson_activities` is replaced by the versioned Activity→Exercise→Question
tree. Rationale: [DECISIONS.md](./DECISIONS.md) D-0009…D-0016.

### 3.3 Vocabulary — **IMPLEMENTED (Sprint 4.1)**

> First learnable feature. Content authored as data (seeded); learner state drives a
> deterministic SRS scheduler (no AI). Rationale: [DECISIONS.md](./DECISIONS.md) D-0017…D-0020.

- **vocabularies** — `id`, `word`, `slug` unique, `lemma?`, `cefr_level_id`(FK), `frequency_rank?`, `status` (ContentStatus), timestamps, `deleted_at`. Index: (`cefr_level_id`),(`status`),(`word`).
- **vocabulary_meanings** — `id`, `vocabulary_id`(FK, Cascade), `part_of_speech` (enum `PartOfSpeech`), `definition`, `translation?`, `sort_order`. Index: (`vocabulary_id`,`sort_order`).
- **vocabulary_examples** — `id`, `vocabulary_id`(FK, Cascade), `meaning_id?`(FK, SetNull), `text`, `translation?`, `sort_order`. Index: (`vocabulary_id`,`sort_order`).
- **vocabulary_pronunciations** — `id`, `vocabulary_id`(FK, Cascade), `ipa`, `accent` (enum `Accent` us/uk), `is_primary`. Index: (`vocabulary_id`).
- **vocabulary_audios** — `id`, `vocabulary_id`(FK, Cascade), `url`, `accent?`, `created_at`. Index: (`vocabulary_id`).
- **vocabulary_images** — `id`, `vocabulary_id`(FK, Cascade), `url`, `alt?`, `is_primary`. Index: (`vocabulary_id`).
- **vocabulary_tags** — join to the shared `tags`: (`vocabulary_id`,`tag_id` PK), Cascade. Index: (`tag_id`).
- **user_vocabulary** — learner ↔ word + SRS state: `id`, `user_id`(FK→profiles, Cascade), `vocabulary_id`(FK, Cascade), `status` (`VocabularyStatus` new/learning/known/mastered), `is_favorite`, `ease`, `interval_days`, `repetitions`, `lapses`, `due_at`, `last_reviewed_at`, timestamps. Index: unique(`user_id`,`vocabulary_id`), (`user_id`,`status`), (`user_id`,`due_at`).
- **review_history** — append-only review log: `id`, `user_vocabulary_id`(FK, Cascade), `user_id`(FK, Cascade), `rating` (`ReviewRating` again/hard/good/easy), `prev_interval_days`, `new_interval_days`, `prev_ease`, `new_ease`, `reviewed_at`. Index: (`user_vocabulary_id`), (`user_id`,`reviewed_at`).

_Enums added:_ `PartOfSpeech`, `VocabularyStatus`, `ReviewRating`, `Accent`.
_Note:_ the Sprint-planning `vocabulary_decks`/`vocabulary_words`/`word_senses`/`embedding`
(pgvector) sketch is superseded by this normalized model; embeddings/decks return with the
AI epic. **Seed:** **100** real A1 words (see `prisma/data/a1-vocabulary.ts`). **Migration:**
baseline `prisma/migrations/20260701000000_init` (Prisma-generated; `prisma migrate deploy`
applies it on a live DB).

### 3.4 Grammar

**grammar_topics** — `id`, `title`, `cefr_level_id`(FK), `summary`, `sort_order`, `is_published`.
**grammar_rules** — `id`, `topic_id`(FK), `title`, `explanation` (rich), `native_explanation`, `examples` (JSONB), `sort_order`.
Index: (`topic_id`,`sort_order`).
**grammar_exercises** — `id`, `topic_id`(FK), `rule_id`(FK, nullable), `type` (mcq/fill_blank/transform/error_correct), `prompt`, `payload` (JSONB), `answer_key` (JSONB), `difficulty`.
Index: (`topic_id`), (`difficulty`).

### 3.5 Listening & Reading

**listening_tracks** — `id`, `title`, `cefr_level_id`(FK), `audio_asset_id`(FK), `transcript`, `duration_sec`, `accent`, `is_ai_tts`, `is_published`.
**reading_passages** — `id`, `title`, `cefr_level_id`(FK), `body`, `word_count`, `topic`, `is_published`.

**comprehension_questions** — shared by listening & reading (polymorphic source).
Cols: `id`, `source_type` (listening/reading), `source_id`, `type` (mcq/true_false/gap_fill/short_answer/ordering), `prompt`, `explanation`, `sort_order`.
Index: (`source_type`,`source_id`).
**answer_options** — `id`, `question_id`(FK), `text`, `is_correct`, `sort_order`.

**user_question_attempts** — `id`, `user_id`(FK), `question_id`(FK), `selected_option_id`(FK, nullable), `response_text`, `is_correct`, `time_ms`, `attempted_at`.
Index: (`user_id`,`question_id`), (`user_id`,`attempted_at`).

### 3.6 Speaking & Pronunciation

**speaking_prompts** — `id`, `cefr_level_id`(FK), `type` (repeat/describe/roleplay/open), `prompt_text`, `reference_text`, `reference_audio_asset_id`(FK), `scenario_id`(FK→conversation_scenarios, nullable).
**speaking_attempts** — `id`, `user_id`(FK), `prompt_id`(FK, nullable), `audio_asset_id`(FK), `transcript`, `fluency_score`, `relevance_score`, `overall_score`, `ai_feedback`, `created_at`.
Index: (`user_id`,`created_at`), (`prompt_id`).
**pronunciation_scores** — `id`, `attempt_id`(FK), `accuracy_score`, `completeness_score`, `prosody_score`, `words` (JSONB per-word).
**phoneme_scores** — `id`, `attempt_id`(FK), `word`, `phoneme`, `score`, `position`.
Index: (`attempt_id`).

### 3.7 Conversation & AI Teacher

**conversation_scenarios** — `id`, `title`, `description`, `cefr_level_id`(FK), `persona` (JSONB: name, role, style), `goal`, `track` (general/business/kids/exam), `is_published`.
**conversations** — `id`, `user_id`(FK), `scenario_id`(FK, nullable), `mode` (free/scenario/roleplay), `cefr_at_start`, `started_at`, `ended_at`, `summary`, `status`.
Index: (`user_id`,`started_at`), (`scenario_id`).
**conversation_messages** — `id`, `conversation_id`(FK), `role` (user/assistant/system), `content`, `audio_asset_id`(FK, nullable), `corrections` (JSONB), `tokens_in`, `tokens_out`, `model`, `created_at`.
Index: (`conversation_id`,`created_at`).

**ai_teacher_sessions** — `id`, `user_id`(FK), `context_type` (review/explain/plan/motivate), `context_ref` (JSONB), `started_at`, `ended_at`.
**ai_feedback** — `id`, `session_id`(FK, nullable), `user_id`(FK), `target_type` (speaking/writing/grammar/vocab/general), `target_id`, `feedback` (rich), `severity`, `created_at`.
Index: (`user_id`,`created_at`), (`target_type`,`target_id`).

### 3.8 Spaced Repetition (SRS)

**srs_cards** — one card per learnable item per user (polymorphic).
Cols: `id`, `user_id`(FK), `item_type` (vocab/grammar/phrase/listening_cloze), `item_id`, `state` (new/learning/review/relearning), `stability`, `difficulty`, `due_at`, `last_reviewed_at`, `reps`, `lapses`, `scheduler` (fsrs), `created_at`.
Index: (`user_id`,`due_at`), unique(`user_id`,`item_type`,`item_id`), (`state`).

**srs_reviews** — append-only review log (partition by `reviewed_at`).
Cols: `id`, `card_id`(FK), `user_id`(FK), `rating` (again/hard/good/easy), `elapsed_ms`, `prev_stability`, `new_stability`, `prev_due`, `new_due`, `reviewed_at`.
Index: (`user_id`,`reviewed_at`), (`card_id`).

### 3.9 Learning Plan & Adaptive Engine

**daily_plans** — `id`, `user_id`(FK), `plan_date`, `target_minutes`, `status` (pending/in_progress/completed/skipped), `generated_by` (engine/ai), `generated_at`.
Index: unique(`user_id`,`plan_date`).
**daily_plan_items** — `id`, `plan_id`(FK), `activity_ref_type` (srs/lesson/speaking/conversation/exam_drill), `activity_ref_id`, `reason` (due_review/new_content/weakness/goal), `estimated_minutes`, `sort_order`, `status`, `completed_at`.
Index: (`plan_id`,`sort_order`), (`status`).

**weakness_profiles** — `id`, `user_id`(FK, unique), `by_skill` (JSONB score map), `by_topic` (JSONB), `updated_at`.
**weakness_signals** — append-only evidence: `id`, `user_id`(FK), `skill_id`(FK), `topic_ref`, `signal` (error/slow/skip/low_score), `weight`, `occurred_at`.
Index: (`user_id`,`occurred_at`), (`skill_id`).

**adaptive_states** — `id`, `user_id`(FK, unique), `estimated_ability` (JSONB per skill, IRT-like theta), `difficulty_target`, `last_recalculated_at`.

### 3.10 Progress & Gamification

**skill_progress** — `id`, `user_id`(FK), `skill_id`(FK), `mastery_pct`, `xp`, `level`, `updated_at`. Index: unique(`user_id`,`skill_id`).
**xp_transactions** — append-only: `id`, `user_id`(FK), `amount`, `source_type`, `source_id`, `created_at`. Index: (`user_id`,`created_at`).
**streaks** — `id`, `user_id`(FK, unique), `current_streak`, `longest_streak`, `last_active_date`, `freezes_available`.
**achievements** — `id`, `code` unique, `title`, `description`, `icon`, `criteria` (JSONB), `xp_reward`.
**user_achievements** — `id`, `user_id`(FK), `achievement_id`(FK), `unlocked_at`. Index: unique(`user_id`,`achievement_id`).
**leaderboards** — `id`, `scope` (global/league/friends), `period` (weekly/monthly), `starts_at`, `ends_at`.
**leaderboard_entries** — `id`, `leaderboard_id`(FK), `user_id`(FK), `xp`, `rank`. Index: (`leaderboard_id`,`rank`), unique(`leaderboard_id`,`user_id`).

### 3.11 Exams & Tracks

**exam_tests** — `id`, `exam_type` (toeic/ielts), `title`, `variant` (academic/general/lr/full), `total_sections`, `duration_min`, `is_mock`, `is_published`.
**exam_sections** — `id`, `test_id`(FK), `section_type` (listening/reading/writing/speaking), `order`, `duration_min`, `instructions`.
**exam_questions** — `id`, `section_id`(FK), `part`, `type`, `prompt`, `passage_or_audio_asset_id`(FK), `answer_key` (JSONB), `points`, `sort_order`. Index: (`section_id`,`sort_order`).
**exam_options** — `id`, `question_id`(FK), `text`, `label`, `is_correct`.
**exam_attempts** — `id`, `user_id`(FK), `test_id`(FK), `started_at`, `submitted_at`, `status`. Index: (`user_id`,`started_at`).
**exam_answers** — `id`, `attempt_id`(FK), `question_id`(FK), `response` (JSONB), `is_correct`, `points_awarded`, `ai_score` (JSONB for writing/speaking).
**exam_scores** — `id`, `attempt_id`(FK, unique), `raw_score`, `scaled_score`, `estimated_band` (IELTS) / `estimated_toeic`, `section_scores` (JSONB), `feedback`.

_Tracks (Business, Kids):_ modeled via `courses.track` + `conversation_scenarios.track` + course-scoped content — **no separate schema needed**, ensuring the same engine powers every track.

### 3.12 Media & AI Operations

**media_assets** — `id`, `kind` (audio/image/video), `bucket`, `object_key`, `mime_type`, `bytes`, `duration_sec`, `checksum` (dedup), `visibility` (public/private), `owner_user_id`(FK, nullable), `created_at`. Index: unique(`checksum`,`kind`), (`owner_user_id`).
**prompt_templates** — `id`, `key` unique, `version`, `role` (teacher/conversation/generator/grader), `template`, `model_default`, `is_active`. Index: unique(`key`,`version`).
**ai_generation_jobs** — `id`, `user_id`(FK, nullable), `job_type` (lesson/tts/scoring/plan), `status` (queued/running/done/failed), `input` (JSONB), `output_ref`, `error`, `created_at`, `finished_at`. Index: (`status`), (`user_id`,`created_at`).
**ai_usage_logs** — append-only: `id`, `user_id`(FK, nullable, `ON DELETE SET NULL`), `feature`, `provider`, `model`, `tokens_in`, `tokens_out`, `cost_micro_usd`, `latency_ms`, `status` (success/failed/fallback), `cache_hit`, `error_code`(nullable), `occurred_at`. Index: (`occurred_at`), (`feature`), (`model`). **Implemented** Milestone 1 (ADR-0003); `status`/`error_code` added so failed and gracefully-degraded calls are observable. No prompt text or secrets are stored.

### 3.13 Billing

**plans** — `id`, `code` unique, `name`, `price_minor`, `currency`, `interval` (month/year), `features` (JSONB), `is_active`.
**subscriptions** — `id`, `user_id`(FK), `plan_id`(FK), `status` (trialing/active/past_due/canceled), `provider` (stripe/apple/google), `provider_sub_id`, `current_period_end`, `cancel_at`. Index: (`user_id`,`status`).
**payments** — `id`, `subscription_id`(FK), `amount_minor`, `currency`, `status`, `provider_payment_id`, `paid_at`.
**invoices** — `id`, `subscription_id`(FK), `amount_minor`, `currency`, `status`, `issued_at`, `pdf_asset_id`(FK).

### 3.14 Notifications & Analytics

**devices** — `id`, `user_id`(FK), `platform` (ios/android/web), `push_token`, `last_seen_at`. Index: (`user_id`), unique(`push_token`).
**notifications** — `id`, `user_id`(FK), `type` (reminder/streak/review_due/achievement/system), `title`, `body`, `data` (JSONB), `read_at`, `sent_at`, `created_at`. Index: (`user_id`,`created_at`), (`read_at`).
**analytics_events** — append-only, partitioned by `occurred_at`: `id`, `user_id`(FK, nullable), `session_id`, `event_name`, `properties` (JSONB), `occurred_at`. Index: (`event_name`,`occurred_at`), (`user_id`,`occurred_at`).

---

## 4. Index & Performance Strategy

- **Every FK is indexed.** Composite indexes match real query paths (e.g., `(user_id, due_at)` for the SRS queue).
- **Hot append-only tables** (`srs_reviews`, `analytics_events`, `ai_usage_logs`, `xp_transactions`, `weakness_signals`) are **range-partitioned by month** and archived on a rolling window.
- **Vector search:** `ivfflat` (or `hnsw`) index on `vocabulary_words.embedding` for semantic recommendations / duplicate detection.
- **Read replicas** serve analytics/reporting; writes go to primary.
- **JSONB** used for flexible/AI-shaped payloads (`payload`, `answer_key`, `properties`) with GIN indexes where queried.
- **Uniqueness** enforced at DB level (emails, one card per item per user, one plan per day).

## 5. Data Integrity Rules

- FKs `ON DELETE`: user-owned data cascades on account deletion (GDPR); content references restrict.
- Content is **versioned** (`content_version` / `version`) — never hard-mutate published content that learners have history against; publish a new version.
- Soft delete (`deleted_at`) for user-facing content; hard delete via privacy workflow.
- All monetary and scoring writes are transactional.

## 6. Future Expansion (designed-for, not-yet-built)

| Future need                                   | How the schema absorbs it                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Writing skill**                             | Add `writing_prompts`, `writing_submissions`, reuse `ai_feedback` + `exam_answers.ai_score` |
| **Peer/social**                               | Add `friendships`, `study_groups`; `leaderboards.scope=friends` already present             |
| **Teacher marketplace**                       | `courses.author_user_id`, `content_reviews`, payouts — plugs into billing                   |
| **B2B / schools**                             | Add `organizations`, `org_members`, `org_licenses`; users gain nullable `org_id`            |
| **New exam types**                            | Add rows to `exam_tests.exam_type` enum — no structural change                              |
| **New languages to learn** (not just English) | `courses.language_id` already generalizes the platform                                      |
| **A/B experiments**                           | `experiments`, `experiment_assignments` alongside `analytics_events`                        |
| **Offline sync**                              | `srs_cards`/`daily_plan_items` carry `updated_at` for conflict resolution                   |
| **Multi-modal content**                       | `media_assets.kind=video`; `lesson_activities.payload` is schemaless                        |

---

_Cross-references:_ how these tables are exposed → [API.md](./API.md); which tables the AI writes → [AI_ENGINE.md](./AI_ENGINE.md); build order → [ROADMAP.md](./ROADMAP.md).
