import { describe, expect, it } from 'vitest';

import { MODELS, OPENAI_MODELS } from './models';
import { computeCostMicroUsd, hasPricing } from './pricing';

describe('computeCostMicroUsd', () => {
  it('prices a Sonnet call from input/output tokens (3 / 15 micro-USD per token)', () => {
    // 1000 in * 3 + 500 out * 15 = 3000 + 7500 = 10500 micro-USD = $0.0105
    expect(computeCostMicroUsd(MODELS.SONNET, 1000, 500)).toBe(10_500);
  });

  it('prices the cheapest tier lower than the flagship for the same tokens', () => {
    const mini = computeCostMicroUsd(OPENAI_MODELS.MINI, 1000, 1000);
    const opus = computeCostMicroUsd(MODELS.OPUS, 1000, 1000);
    expect(mini).toBeLessThan(opus);
  });

  it('returns 0 (and hasPricing=false) for an unknown model', () => {
    expect(computeCostMicroUsd('mystery-model', 1000, 1000)).toBe(0);
    expect(hasPricing('mystery-model')).toBe(false);
    expect(hasPricing(MODELS.HAIKU)).toBe(true);
  });

  it('rounds to a whole micro-USD and never goes negative', () => {
    const cost = computeCostMicroUsd(OPENAI_MODELS.MINI, 3, 3); // 3*0.15 + 3*0.6 = 2.25
    expect(cost).toBe(2);
    expect(computeCostMicroUsd(MODELS.HAIKU, 0, 0)).toBe(0);
  });
});
