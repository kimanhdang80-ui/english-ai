import type { AiUsageLogEntry } from '@/modules/ai/domain/entities';
import type { AiUsageLogRepository } from '@/modules/ai/application/ports';

/**
 * No-op usage-log sink used when no database is configured. AI still runs; telemetry
 * is simply not persisted (the Prisma repo takes over once a DB is provisioned).
 */
export class NoopAiUsageLogRepository implements AiUsageLogRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async append(_entry: AiUsageLogEntry): Promise<void> {
    // intentionally does nothing
  }
}
