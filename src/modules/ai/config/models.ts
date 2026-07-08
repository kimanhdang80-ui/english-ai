/**
 * Model registry — the ONLY place model ids live (AI_ENGINE.md; CLAUDE.md §3).
 * Model ids are configuration strings so provider/model upgrades are a one-line change.
 * Tiering: Opus (hardest) → Sonnet (default) → Haiku (cheap/fast).
 */
export const MODELS = {
  OPUS: 'claude-opus-4-8',
  SONNET: 'claude-sonnet-4-6',
  HAIKU: 'claude-haiku-4-5-20251001',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/** OpenAI model ids — used when the OpenAI provider is selected. */
export const OPENAI_MODELS = {
  FLAGSHIP: 'gpt-4o',
  MINI: 'gpt-4o-mini',
} as const;

export type OpenAiModelId = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];

export type ProviderName = 'anthropic' | 'openai';

/**
 * Default model per provider. A prompt version may still pin its own model
 * (`PromptVersion.model`); this is the fallback when a request doesn't specify one,
 * and the target that provider-neutral capabilities (explanation/example/feedback) use.
 */
export const DEFAULT_MODEL_BY_PROVIDER: Record<ProviderName, string> = {
  anthropic: MODELS.SONNET,
  openai: OPENAI_MODELS.MINI,
};
