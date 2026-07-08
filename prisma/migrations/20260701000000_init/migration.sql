-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "LearningGoal" AS ENUM ('general', 'conversation', 'exam', 'business', 'kids');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('web', 'ios', 'android');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'push', 'in_app');

-- CreateEnum
CREATE TYPE "CourseTrack" AS ENUM ('general', 'toeic', 'ielts', 'business', 'kids');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('intro', 'teach', 'practice', 'quiz', 'review', 'assessment');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('flashcard', 'multiple_choice', 'fill_blank', 'matching', 'ordering', 'dictation', 'speaking', 'listening', 'open_response');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'matching', 'ordering');

-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('prerequisite', 'recommended');

-- CreateEnum
CREATE TYPE "PathStepType" AS ENUM ('course', 'lesson', 'objective');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'determiner', 'interjection', 'phrase');

-- CreateEnum
CREATE TYPE "VocabularyStatus" AS ENUM ('new', 'learning', 'known', 'mastered');

-- CreateEnum
CREATE TYPE "ReviewRating" AS ENUM ('again', 'hard', 'good', 'easy');

-- CreateEnum
CREATE TYPE "Accent" AS ENUM ('us', 'uk');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "is_kid" BOOLEAN NOT NULL DEFAULT false,
    "native_language_id" UUID,
    "learning_goal" "LearningGoal" NOT NULL DEFAULT 'general',
    "current_cefr" TEXT,
    "target_cefr" TEXT,
    "daily_minutes_goal" INTEGER NOT NULL DEFAULT 15,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "ui_locale" TEXT NOT NULL DEFAULT 'en',
    "onboarded_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "marketing_emails" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "platform" "DevicePlatform" NOT NULL DEFAULT 'web',
    "device_name" TEXT,
    "user_agent" TEXT,
    "push_token" TEXT,
    "ip_address" TEXT,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" UUID,
    "refresh_token_hash" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "native_name" TEXT,
    "is_ui_supported" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cefr_levels" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "cefr_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "difficulties" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "difficulties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "track" "CourseTrack" NOT NULL DEFAULT 'general',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "language_id" UUID NOT NULL,
    "cefr_level_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "primary_skill_id" UUID,
    "cefr_level_id" UUID,
    "difficulty_id" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "estimated_minutes" INTEGER NOT NULL DEFAULT 5,
    "xp_reward" INTEGER NOT NULL DEFAULT 10,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "current_version_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_versions" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "lesson_version_id" UUID NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT,
    "instructions" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "prompt" TEXT,
    "difficulty_id" UUID,
    "config" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "type" "QuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty_id" UUID,
    "metadata" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choices" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "label" TEXT,
    "content" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "match_mode" TEXT NOT NULL DEFAULT 'exact',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_dependencies" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "depends_on_lesson_id" UUID NOT NULL,
    "type" "DependencyType" NOT NULL DEFAULT 'prerequisite',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "skill_id" UUID,
    "cefr_level_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "track" "CourseTrack" NOT NULL DEFAULT 'general',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_steps" (
    "id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "stepType" "PathStepType" NOT NULL,
    "course_id" UUID,
    "lesson_id" UUID,
    "objective_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_tags" (
    "lesson_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "lesson_tags_pkey" PRIMARY KEY ("lesson_id","tag_id")
);

-- CreateTable
CREATE TABLE "lesson_objectives" (
    "lesson_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,

    CONSTRAINT "lesson_objectives_pkey" PRIMARY KEY ("lesson_id","objective_id")
);

-- CreateTable
CREATE TABLE "vocabularies" (
    "id" UUID NOT NULL,
    "word" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lemma" TEXT,
    "cefr_level_id" UUID,
    "frequency_rank" INTEGER,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_meanings" (
    "id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "part_of_speech" "PartOfSpeech" NOT NULL,
    "definition" TEXT NOT NULL,
    "translation" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vocabulary_meanings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_examples" (
    "id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "meaning_id" UUID,
    "text" TEXT NOT NULL,
    "translation" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vocabulary_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_pronunciations" (
    "id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "ipa" TEXT NOT NULL,
    "accent" "Accent" NOT NULL DEFAULT 'us',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vocabulary_pronunciations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_audios" (
    "id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "accent" "Accent",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vocabulary_audios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_images" (
    "id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vocabulary_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary_tags" (
    "vocabulary_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "vocabulary_tags_pkey" PRIMARY KEY ("vocabulary_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_vocabulary" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "vocabulary_id" UUID NOT NULL,
    "status" "VocabularyStatus" NOT NULL DEFAULT 'new',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "due_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_history" (
    "id" UUID NOT NULL,
    "user_vocabulary_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" "ReviewRating" NOT NULL,
    "prev_interval_days" INTEGER NOT NULL,
    "new_interval_days" INTEGER NOT NULL,
    "prev_ease" DOUBLE PRECISION NOT NULL,
    "new_ease" DOUBLE PRECISION NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_status_idx" ON "profiles"("status");

-- CreateIndex
CREATE INDEX "profiles_native_language_id_idx" ON "profiles"("native_language_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_push_token_key" ON "user_devices"("push_token");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_channel_category_key" ON "notification_preferences"("user_id", "channel", "category");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cefr_levels_code_key" ON "cefr_levels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skills_code_key" ON "skills"("code");

-- CreateIndex
CREATE UNIQUE INDEX "difficulties_code_key" ON "difficulties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_track_idx" ON "courses"("track");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "courses_cefr_level_id_idx" ON "courses"("cefr_level_id");

-- CreateIndex
CREATE INDEX "units_course_id_sort_order_idx" ON "units"("course_id", "sort_order");

-- CreateIndex
CREATE INDEX "units_status_idx" ON "units"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_current_version_id_key" ON "lessons"("current_version_id");

-- CreateIndex
CREATE INDEX "lessons_unit_id_sort_order_idx" ON "lessons"("unit_id", "sort_order");

-- CreateIndex
CREATE INDEX "lessons_primary_skill_id_idx" ON "lessons"("primary_skill_id");

-- CreateIndex
CREATE INDEX "lessons_cefr_level_id_idx" ON "lessons"("cefr_level_id");

-- CreateIndex
CREATE INDEX "lessons_difficulty_id_idx" ON "lessons"("difficulty_id");

-- CreateIndex
CREATE INDEX "lessons_status_idx" ON "lessons"("status");

-- CreateIndex
CREATE INDEX "lesson_versions_status_idx" ON "lesson_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_versions_lesson_id_version_number_key" ON "lesson_versions"("lesson_id", "version_number");

-- CreateIndex
CREATE INDEX "activities_lesson_version_id_sort_order_idx" ON "activities"("lesson_version_id", "sort_order");

-- CreateIndex
CREATE INDEX "exercises_activity_id_sort_order_idx" ON "exercises"("activity_id", "sort_order");

-- CreateIndex
CREATE INDEX "exercises_difficulty_id_idx" ON "exercises"("difficulty_id");

-- CreateIndex
CREATE INDEX "questions_exercise_id_sort_order_idx" ON "questions"("exercise_id", "sort_order");

-- CreateIndex
CREATE INDEX "questions_difficulty_id_idx" ON "questions"("difficulty_id");

-- CreateIndex
CREATE INDEX "choices_question_id_sort_order_idx" ON "choices"("question_id", "sort_order");

-- CreateIndex
CREATE INDEX "answers_question_id_idx" ON "answers"("question_id");

-- CreateIndex
CREATE INDEX "lesson_dependencies_depends_on_lesson_id_idx" ON "lesson_dependencies"("depends_on_lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_dependencies_lesson_id_depends_on_lesson_id_key" ON "lesson_dependencies"("lesson_id", "depends_on_lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_objectives_code_key" ON "learning_objectives"("code");

-- CreateIndex
CREATE INDEX "learning_objectives_skill_id_idx" ON "learning_objectives"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths"("slug");

-- CreateIndex
CREATE INDEX "learning_paths_track_idx" ON "learning_paths"("track");

-- CreateIndex
CREATE INDEX "learning_paths_status_idx" ON "learning_paths"("status");

-- CreateIndex
CREATE INDEX "learning_path_steps_path_id_sort_order_idx" ON "learning_path_steps"("path_id", "sort_order");

-- CreateIndex
CREATE INDEX "lesson_tags_tag_id_idx" ON "lesson_tags"("tag_id");

-- CreateIndex
CREATE INDEX "lesson_objectives_objective_id_idx" ON "lesson_objectives"("objective_id");

-- CreateIndex
CREATE UNIQUE INDEX "vocabularies_slug_key" ON "vocabularies"("slug");

-- CreateIndex
CREATE INDEX "vocabularies_cefr_level_id_idx" ON "vocabularies"("cefr_level_id");

-- CreateIndex
CREATE INDEX "vocabularies_status_idx" ON "vocabularies"("status");

-- CreateIndex
CREATE INDEX "vocabularies_word_idx" ON "vocabularies"("word");

-- CreateIndex
CREATE INDEX "vocabulary_meanings_vocabulary_id_sort_order_idx" ON "vocabulary_meanings"("vocabulary_id", "sort_order");

-- CreateIndex
CREATE INDEX "vocabulary_examples_vocabulary_id_sort_order_idx" ON "vocabulary_examples"("vocabulary_id", "sort_order");

-- CreateIndex
CREATE INDEX "vocabulary_pronunciations_vocabulary_id_idx" ON "vocabulary_pronunciations"("vocabulary_id");

-- CreateIndex
CREATE INDEX "vocabulary_audios_vocabulary_id_idx" ON "vocabulary_audios"("vocabulary_id");

-- CreateIndex
CREATE INDEX "vocabulary_images_vocabulary_id_idx" ON "vocabulary_images"("vocabulary_id");

-- CreateIndex
CREATE INDEX "vocabulary_tags_tag_id_idx" ON "vocabulary_tags"("tag_id");

-- CreateIndex
CREATE INDEX "user_vocabulary_user_id_status_idx" ON "user_vocabulary"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_vocabulary_user_id_due_at_idx" ON "user_vocabulary"("user_id", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_vocabulary_user_id_vocabulary_id_key" ON "user_vocabulary"("user_id", "vocabulary_id");

-- CreateIndex
CREATE INDEX "review_history_user_vocabulary_id_idx" ON "review_history"("user_vocabulary_id");

-- CreateIndex
CREATE INDEX "review_history_user_id_reviewed_at_idx" ON "review_history"("user_id", "reviewed_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_native_language_id_fkey" FOREIGN KEY ("native_language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "user_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_cefr_level_id_fkey" FOREIGN KEY ("cefr_level_id") REFERENCES "cefr_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_primary_skill_id_fkey" FOREIGN KEY ("primary_skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_cefr_level_id_fkey" FOREIGN KEY ("cefr_level_id") REFERENCES "cefr_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_difficulty_id_fkey" FOREIGN KEY ("difficulty_id") REFERENCES "difficulties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "lesson_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lesson_version_id_fkey" FOREIGN KEY ("lesson_version_id") REFERENCES "lesson_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_difficulty_id_fkey" FOREIGN KEY ("difficulty_id") REFERENCES "difficulties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_difficulty_id_fkey" FOREIGN KEY ("difficulty_id") REFERENCES "difficulties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_dependencies" ADD CONSTRAINT "lesson_dependencies_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_dependencies" ADD CONSTRAINT "lesson_dependencies_depends_on_lesson_id_fkey" FOREIGN KEY ("depends_on_lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_steps" ADD CONSTRAINT "learning_path_steps_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_tags" ADD CONSTRAINT "lesson_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_objectives" ADD CONSTRAINT "lesson_objectives_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_objectives" ADD CONSTRAINT "lesson_objectives_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_cefr_level_id_fkey" FOREIGN KEY ("cefr_level_id") REFERENCES "cefr_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_meanings" ADD CONSTRAINT "vocabulary_meanings_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_examples" ADD CONSTRAINT "vocabulary_examples_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_examples" ADD CONSTRAINT "vocabulary_examples_meaning_id_fkey" FOREIGN KEY ("meaning_id") REFERENCES "vocabulary_meanings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_pronunciations" ADD CONSTRAINT "vocabulary_pronunciations_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_audios" ADD CONSTRAINT "vocabulary_audios_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_images" ADD CONSTRAINT "vocabulary_images_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_tags" ADD CONSTRAINT "vocabulary_tags_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary_tags" ADD CONSTRAINT "vocabulary_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vocabulary" ADD CONSTRAINT "user_vocabulary_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_user_vocabulary_id_fkey" FOREIGN KEY ("user_vocabulary_id") REFERENCES "user_vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

