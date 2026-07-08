import type { PrismaClient } from '@prisma/client';

import type { AiUsageLogEntry } from '@/modules/ai/domain/entities';
import type { AiUsageLogRepository } from '@/modules/ai/application/ports';

/**
 * Persists AI-call telemetry to `ai_usage_logs` (ADR-0003). Append-only and
 * fire-and-forget: a logging failure must never break the AI call, so `append`
 * swallows its own errors after a single console warning.
 */
export class PrismaAiUsageLogRepository implements AiUsageLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(entry: AiUsageLogEntry): Promise<void> {
    try {
      await this.prisma.aiUsageLog.create({
        data: {
          userId: entry.userId ?? null,
          feature: entry.feature,
          provider: entry.provider,
          model: entry.model,
          tokensIn: entry.tokensIn,
          tokensOut: entry.tokensOut,
          costMicroUsd: entry.costMicroUsd,
          latencyMs: entry.latencyMs,
          status: entry.status,
          cacheHit: entry.cacheHit,
          errorCode: entry.errorCode ?? null,
          occurredAt: new Date(entry.occurredAt),
        },
      });
    } catch (error) {
      // Telemetry is best-effort; never surface a logging failure to the learner.
      console.warn('[ai] failed to persist ai_usage_log', {
        feature: entry.feature,
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }
}
