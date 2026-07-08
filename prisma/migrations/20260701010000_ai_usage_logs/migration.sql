-- Milestone 1 (Real AI) / ADR-0003 — append-only AI telemetry.
-- Expand-only, backward-compatible: one new table + one nullable FK to profiles.
-- No changes to existing columns/rows; rollback = DROP TABLE "ai_usage_logs".

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokens_in" INTEGER NOT NULL DEFAULT 0,
    "tokens_out" INTEGER NOT NULL DEFAULT 0,
    "cost_micro_usd" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "cache_hit" BOOLEAN NOT NULL DEFAULT false,
    "error_code" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_logs_occurred_at_idx" ON "ai_usage_logs"("occurred_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_feature_idx" ON "ai_usage_logs"("feature");

-- CreateIndex
CREATE INDEX "ai_usage_logs_model_idx" ON "ai_usage_logs"("model");

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
