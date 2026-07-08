import { describe, expect, it } from 'vitest';

import type { LlmCompletion } from '@/modules/ai/domain/entities';
import {
  emptyAggregate,
  type AiUsageAggregate,
} from '@/modules/ai/domain/metrics';
import type {
  AiMetricsRepository,
  LlmPort,
} from '@/modules/ai/application/ports';

import { AiHealthService, type AiCircuit } from './ai-health-service';

function llm(configured: boolean): LlmPort {
  return {
    providerName: 'anthropic',
    configured,
    complete: async (): Promise<LlmCompletion> => ({
      text: '',
      tokensIn: 0,
      tokensOut: 0,
    }),
  };
}

function metrics(agg: AiUsageAggregate): AiMetricsRepository {
  return { aggregate: async () => agg };
}

const clock = () => new Date('2026-07-02T00:00:00.000Z');

describe('AiHealthService', () => {
  it('reports "unconfigured" when the provider has no key', async () => {
    const svc = new AiHealthService(llm(false), null, () => 'n/a', clock);
    const report = await svc.report();
    expect(report.status).toBe('unconfigured');
    expect(report.window).toBeNull();
  });

  it('reports "ok" when configured but no DB (no window)', async () => {
    const svc = new AiHealthService(llm(true), null, () => 'closed', clock);
    const report = await svc.report();
    expect(report.status).toBe('ok');
    expect(report.databaseAvailable).toBe(false);
  });

  it('reports "ok" with a healthy success rate', async () => {
    const agg: AiUsageAggregate = {
      ...emptyAggregate(24),
      total: 10,
      success: 9,
      fallback: 1,
    };
    const svc = new AiHealthService(
      llm(true),
      metrics(agg),
      () => 'closed',
      clock,
    );
    const report = await svc.report();
    expect(report.status).toBe('ok');
    expect(report.window?.successRate).toBeCloseTo(0.9);
  });

  it('reports "degraded" on a low success rate', async () => {
    const agg: AiUsageAggregate = {
      ...emptyAggregate(24),
      total: 10,
      success: 2,
      failed: 8,
    };
    const svc = new AiHealthService(
      llm(true),
      metrics(agg),
      () => 'closed',
      clock,
    );
    expect((await svc.report()).status).toBe('degraded');
  });

  it('reports "degraded" when the circuit is open regardless of rate', async () => {
    const agg: AiUsageAggregate = {
      ...emptyAggregate(24),
      total: 5,
      success: 5,
    };
    const circuit: AiCircuit = 'open';
    const svc = new AiHealthService(
      llm(true),
      metrics(agg),
      () => circuit,
      clock,
    );
    expect((await svc.report()).status).toBe('degraded');
  });
});
