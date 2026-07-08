import type { AiMetricsRepository } from '@/modules/ai/application/ports';
import {
  summarizeUsage,
  type AiMetricsSummary,
} from '@/modules/ai/domain/metrics';

/**
 * Thin application service over the metrics read side: rolls up `ai_usage_logs` for a window
 * and derives the presentation summary (pure `summarizeUsage`). Powers the AI Metrics
 * Dashboard and the health check.
 */
export class AiMetricsService {
  constructor(private readonly repo: AiMetricsRepository) {}

  async summary(windowHours = 24): Promise<AiMetricsSummary> {
    return summarizeUsage(await this.repo.aggregate(windowHours));
  }
}
