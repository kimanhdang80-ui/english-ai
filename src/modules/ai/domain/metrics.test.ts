import { describe, expect, it } from 'vitest';

import {
  emptyAggregate,
  summarizeUsage,
  type AiUsageAggregate,
} from './metrics';

describe('summarizeUsage', () => {
  const agg: AiUsageAggregate = {
    windowHours: 24,
    total: 10,
    success: 7,
    failed: 1,
    fallback: 2,
    tokensIn: 1000,
    tokensOut: 500,
    costMicroUsd: 15_000, // $0.015
    latencySumMs: 5000,
    byModel: [
      {
        model: 'a',
        requests: 3,
        tokensIn: 100,
        tokensOut: 50,
        costMicroUsd: 1000,
      },
      {
        model: 'b',
        requests: 7,
        tokensIn: 900,
        tokensOut: 450,
        costMicroUsd: 14_000,
      },
    ],
    byFeature: [
      { feature: 'x', requests: 4 },
      { feature: 'y', requests: 6 },
    ],
  };

  it('derives rates, averages, and USD cost', () => {
    const m = summarizeUsage(agg);
    expect(m.requests).toBe(10);
    expect(m.successRate).toBeCloseTo(0.7);
    expect(m.fallbackRate).toBeCloseTo(0.2);
    expect(m.fallbackCount).toBe(2);
    expect(m.avgLatencyMs).toBe(500); // 5000 / 10
    expect(m.totalTokens).toBe(1500);
    expect(m.costUsd).toBeCloseTo(0.015);
  });

  it('sorts model/feature breakdowns by request count desc', () => {
    const m = summarizeUsage(agg);
    expect(m.byModel[0]?.model).toBe('b');
    expect(m.byFeature[0]?.feature).toBe('y');
  });

  it('handles an empty window without dividing by zero', () => {
    const m = summarizeUsage(emptyAggregate(24));
    expect(m.requests).toBe(0);
    expect(m.successRate).toBe(0);
    expect(m.avgLatencyMs).toBe(0);
    expect(m.costUsd).toBe(0);
  });
});
