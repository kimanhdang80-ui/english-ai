import type { PrismaClient } from '@prisma/client';

import type { AiMetricsRepository } from '@/modules/ai/application/ports';
import {
  emptyAggregate,
  type AiUsageAggregate,
} from '@/modules/ai/domain/metrics';

/**
 * Rolls up `ai_usage_logs` over a time window via Prisma `groupBy`/aggregate — the read
 * side that feeds the metrics dashboard + AI health check. No new table (ADR-0003 columns,
 * incl. `cost_micro_usd`). Read-only; never on the learner's critical path.
 */
export class PrismaAiMetricsRepository implements AiMetricsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async aggregate(sinceHours: number): Promise<AiUsageAggregate> {
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const where = { occurredAt: { gte: since } };

    const [byStatus, byModel, byFeature] = await Promise.all([
      this.prisma.aiUsageLog.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
        _sum: {
          tokensIn: true,
          tokensOut: true,
          costMicroUsd: true,
          latencyMs: true,
        },
      }),
      this.prisma.aiUsageLog.groupBy({
        by: ['model'],
        where,
        _count: { _all: true },
        _sum: { tokensIn: true, tokensOut: true, costMicroUsd: true },
      }),
      this.prisma.aiUsageLog.groupBy({
        by: ['feature'],
        where,
        _count: { _all: true },
      }),
    ]);

    const agg = emptyAggregate(sinceHours);
    for (const row of byStatus) {
      const count = row._count._all;
      agg.total += count;
      if (row.status === 'success') agg.success += count;
      else if (row.status === 'failed') agg.failed += count;
      else if (row.status === 'fallback') agg.fallback += count;
      agg.tokensIn += row._sum.tokensIn ?? 0;
      agg.tokensOut += row._sum.tokensOut ?? 0;
      agg.costMicroUsd += row._sum.costMicroUsd ?? 0;
      agg.latencySumMs += row._sum.latencyMs ?? 0;
    }

    agg.byModel = byModel.map((row) => ({
      model: row.model,
      requests: row._count._all,
      tokensIn: row._sum.tokensIn ?? 0,
      tokensOut: row._sum.tokensOut ?? 0,
      costMicroUsd: row._sum.costMicroUsd ?? 0,
    }));

    agg.byFeature = byFeature.map((row) => ({
      feature: row.feature,
      requests: row._count._all,
    }));

    return agg;
  }
}
