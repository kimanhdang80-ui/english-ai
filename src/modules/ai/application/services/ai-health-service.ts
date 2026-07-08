import type {
  AiMetricsRepository,
  LlmPort,
} from '@/modules/ai/application/ports';
import { summarizeUsage } from '@/modules/ai/domain/metrics';

export type AiCircuit = 'closed' | 'open' | 'half_open' | 'composite' | 'n/a';

export type AiHealthStatus = 'ok' | 'degraded' | 'unconfigured';

export interface AiHealthWindow {
  hours: number;
  requests: number;
  successRate: number;
  fallbackRate: number;
  avgLatencyMs: number;
  costUsd: number;
}

export interface AiHealthReport {
  status: AiHealthStatus;
  provider: string;
  configured: boolean;
  circuit: AiCircuit;
  databaseAvailable: boolean;
  window: AiHealthWindow | null;
  checkedAt: string;
}

/** Below this recent success rate (with traffic), the AI layer is reported "degraded". */
const DEGRADED_SUCCESS_RATE = 0.5;

/**
 * AI layer health probe. Combines static config (provider configured?), the circuit-breaker
 * state (injected — infrastructure knows the concrete provider), and recent success/latency
 * from `ai_usage_logs`. When no DB is configured, reports config/circuit only (no window).
 * Read-only; safe to call from a health endpoint.
 */
export class AiHealthService {
  constructor(
    private readonly llm: LlmPort,
    private readonly metrics: AiMetricsRepository | null,
    private readonly getCircuit: () => AiCircuit,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async report(windowHours = 24): Promise<AiHealthReport> {
    const configured = this.llm.configured;
    const circuit = this.getCircuit();
    const base = {
      provider: this.llm.providerName,
      configured,
      circuit,
      databaseAvailable: this.metrics !== null,
      checkedAt: this.clock().toISOString(),
    };

    if (!configured) {
      return { ...base, status: 'unconfigured', window: null };
    }
    if (!this.metrics) {
      // Configured but no telemetry store — can't measure; not an error.
      return { ...base, status: 'ok', window: null };
    }

    const summary = summarizeUsage(await this.metrics.aggregate(windowHours));
    const window: AiHealthWindow = {
      hours: windowHours,
      requests: summary.requests,
      successRate: summary.successRate,
      fallbackRate: summary.fallbackRate,
      avgLatencyMs: summary.avgLatencyMs,
      costUsd: summary.costUsd,
    };

    const degraded =
      circuit === 'open' ||
      (summary.requests > 0 && summary.successRate < DEGRADED_SUCCESS_RATE);

    return { ...base, status: degraded ? 'degraded' : 'ok', window };
  }
}
