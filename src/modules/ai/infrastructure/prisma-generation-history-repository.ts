import type { PrismaClient, Prisma } from '@prisma/client';

import type { GenerationRecord } from '@/modules/ai/domain/entities';
import type { GenerationHistoryRepository } from '@/modules/ai/application/ports';

/**
 * Durable AI generation history (`ai_generation_jobs`, ADR-0005). Replaces the in-memory
 * store: every generation (previewed/completed/failed) is appended and survives restarts.
 * The request/result are stored as JSON documents (derived read models, no secrets).
 */
export class PrismaGenerationHistoryRepository implements GenerationHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(record: GenerationRecord): Promise<void> {
    await this.prisma.aiGenerationJob.create({
      data: {
        id: record.id,
        request: record.request as unknown as Prisma.InputJsonValue,
        result: record.result as unknown as Prisma.InputJsonValue,
        occurredAt: new Date(record.occurredAt),
      },
    });
  }

  async list(limit: number): Promise<GenerationRecord[]> {
    const rows = await this.prisma.aiGenerationJob.findMany({
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      request: r.request as unknown as GenerationRecord['request'],
      result: r.result as unknown as GenerationRecord['result'],
      occurredAt: r.occurredAt.toISOString(),
    }));
  }
}
