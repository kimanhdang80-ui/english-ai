/**
 * AI observability read-models (framework-free). `AiUsageAggregate` is the raw rollup a
 * repository produces from `ai_usage_logs`; `summarizeUsage` derives the dashboard/health
 * view (rates, averages, cost in USD) as a **pure** function so it is unit-testable without
 * a database. No provider calls, no persistence here.
 */

export interface ModelUsage {
  model: string;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
}

export interface FeatureUsage {
  feature: string;
  requests: number;
}

/** Raw rollup over a time window (produced by `AiMetricsRepository`). */
export interface AiUsageAggregate {
  windowHours: number;
  total: number;
  success: number;
  failed: number;
  fallback: number;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
  latencySumMs: number;
  byModel: ModelUsage[];
  byFeature: FeatureUsage[];
}

/** Derived, presentation-ready metrics for the dashboard + health check. */
export interface AiMetricsSummary {
  windowHours: number;
  requests: number;
  successRate: number; // 0..1
  fallbackRate: number; // 0..1
  fallbackCount: number;
  failedCount: number;
  successCount: number;
  avgLatencyMs: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  costMicroUsd: number;
  costUsd: number;
  byModel: ModelUsage[];
  byFeature: FeatureUsage[];
}

export function emptyAggregate(windowHours: number): AiUsageAggregate {
  return {
    windowHours,
    total: 0,
    success: 0,
    failed: 0,
    fallback: 0,
    tokensIn: 0,
    tokensOut: 0,
    costMicroUsd: 0,
    latencySumMs: 0,
    byModel: [],
    byFeature: [],
  };
}

const ratio = (part: number, whole: number): number =>
  whole > 0 ? part / whole : 0;

/** Pure: raw aggregate → derived metrics (rates, averages, USD). */
export function summarizeUsage(agg: AiUsageAggregate): AiMetricsSummary {
  return {
    windowHours: agg.windowHours,
    requests: agg.total,
    successRate: ratio(agg.success, agg.total),
    fallbackRate: ratio(agg.fallback, agg.total),
    fallbackCount: agg.fallback,
    failedCount: agg.failed,
    successCount: agg.success,
    avgLatencyMs: Math.round(ratio(agg.latencySumMs, agg.total)),
    tokensIn: agg.tokensIn,
    tokensOut: agg.tokensOut,
    totalTokens: agg.tokensIn + agg.tokensOut,
    costMicroUsd: agg.costMicroUsd,
    costUsd: agg.costMicroUsd / 1_000_000,
    byModel: [...agg.byModel].sort((a, b) => b.requests - a.requests),
    byFeature: [...agg.byFeature].sort((a, b) => b.requests - a.requests),
  };
}
