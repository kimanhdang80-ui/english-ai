-- RC-03 Persistence Production Ready (ADR-0005): durable stores that replace the
-- in-memory runtime repositories — learning_sessions, lesson_plans, content_tracks,
-- content_missions, mission_progress, prompt_templates, prompt_versions,
-- ai_generation_jobs. Additive only; no existing table is altered. Generated via
-- `prisma migrate diff` (offline). Rollback: see ADR-0005.

-- CreateTable
CREATE TABLE "learning_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "words_studied" INTEGER NOT NULL DEFAULT 0,
    "quiz_score" INTEGER NOT NULL DEFAULT 0,
    "quiz_total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_date" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tracks" (
    "key" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "cefr" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_tracks_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "content_missions" (
    "id" TEXT NOT NULL,
    "track_key" TEXT NOT NULL,
    "mission_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mission_id" TEXT NOT NULL,
    "completed_activity_ids" JSONB NOT NULL,
    "quiz_score" DOUBLE PRECISION,
    "quiz_total" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "active_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "max_output_tokens" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generation_jobs" (
    "id" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_sessions_user_id_completed_at_idx" ON "learning_sessions"("user_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plans_user_id_key" ON "lesson_plans"("user_id");

-- CreateIndex
CREATE INDEX "content_missions_track_key_mission_order_idx" ON "content_missions"("track_key", "mission_order");

-- CreateIndex
CREATE INDEX "mission_progress_user_id_idx" ON "mission_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mission_progress_user_id_mission_id_key" ON "mission_progress"("user_id", "mission_id");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_key_key" ON "prompt_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_template_id_version_key" ON "prompt_versions"("template_id", "version");

-- CreateIndex
CREATE INDEX "ai_generation_jobs_occurred_at_idx" ON "ai_generation_jobs"("occurred_at");

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_missions" ADD CONSTRAINT "content_missions_track_key_fkey" FOREIGN KEY ("track_key") REFERENCES "content_tracks"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_progress" ADD CONSTRAINT "mission_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "prompt_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

