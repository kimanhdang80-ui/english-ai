import { MODELS, OPENAI_MODELS } from './models';

/**
 * Model pricing — the ONLY place token prices live (mirrors models.ts for cost).
 * Rates are **micro-USD per token** (1 micro-USD = 1e-6 USD), i.e. the published
 * "$ per 1M tokens" price used directly (e.g. $3 / 1M tokens = 3 micro-USD / token).
 *
 * These are list prices at authoring time and are **configuration, not truth** — verify
 * against the provider's current pricing (see AI_COST_GUIDE.md) and update here only.
 * Cost is estimated for budgeting/observability; it is never on the learner's critical path.
 */
export interface ModelPricing {
  /** micro-USD per input token */
  inputPerToken: number;
  /** micro-USD per output token */
  outputPerToken: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  [MODELS.OPUS]: { inputPerToken: 15, outputPerToken: 75 },
  [MODELS.SONNET]: { inputPerToken: 3, outputPerToken: 15 },
  [MODELS.HAIKU]: { inputPerToken: 0.8, outputPerToken: 4 },
  [OPENAI_MODELS.FLAGSHIP]: { inputPerToken: 2.5, outputPerToken: 10 },
  [OPENAI_MODELS.MINI]: { inputPerToken: 0.15, outputPerToken: 0.6 },
};

/**
 * Estimated cost of a completion in **micro-USD** (rounded). Returns 0 for an unknown
 * model (no pricing row) so a missing price never breaks logging — surfaced instead as a
 * `pricingKnown=false` signal by callers that care. Never throws.
 */
export function computeCostMicroUsd(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  const cost =
    tokensIn * pricing.inputPerToken + tokensOut * pricing.outputPerToken;
  return Math.max(0, Math.round(cost));
}

/** Whether a model has a known pricing row (for cost-confidence reporting). */
export function hasPricing(model: string): boolean {
  return model in MODEL_PRICING;
}
