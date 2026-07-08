import {
  DEFAULT_MODEL_BY_PROVIDER,
  type ProviderName,
} from '@/modules/ai/config/models';

import { CircuitBreakerProvider } from './circuit-breaker-provider';
import { ClaudeProvider } from './claude-provider';
import { FallbackProvider } from './fallback-provider';
import { OpenAIProvider } from './openai-provider';
import { RetryingProvider } from './retrying-provider';
import { UnconfiguredProvider } from './unconfigured-provider';
import { type AIProvider } from './types';

export interface ProviderFactoryConfig {
  provider: ProviderName;
  fallbackProvider: ProviderName | 'none';
  anthropicApiKey: string;
  openaiApiKey: string;
  timeoutMs: number;
  maxRetries: number;
  circuitFailureThreshold: number;
  circuitCooldownMs: number;
}

/**
 * Builds the AI provider chain from configuration (env → `aiEnv`). Selection is
 * config-driven so switching providers is a one-line env change, never a code edit
 * (CLAUDE.md §3). Each base provider is wrapped with **retry/timeout** then a
 * **circuit breaker** (`Breaker(Retrying(base))`); when a fallback provider is configured
 * the two chains are composed under a provider-level `FallbackProvider`. Adding Gemini
 * later is a new `case` here plus its adapter; nothing else changes.
 */
export class ProviderFactory {
  static create(config: ProviderFactoryConfig): AIProvider {
    const primary = ProviderFactory.buildResilient(config.provider, config);
    if (config.fallbackProvider === 'none') return primary;

    const secondary = ProviderFactory.buildResilient(
      config.fallbackProvider,
      config,
    );
    return new FallbackProvider(primary, secondary);
  }

  /** base → retry/timeout → circuit breaker (per provider). */
  private static buildResilient(
    name: ProviderName,
    config: ProviderFactoryConfig,
  ): AIProvider {
    const base = ProviderFactory.buildBase(name, config);
    const retrying = new RetryingProvider(base, {
      maxRetries: config.maxRetries,
    });
    return new CircuitBreakerProvider(retrying, {
      failureThreshold: config.circuitFailureThreshold,
      cooldownMs: config.circuitCooldownMs,
    });
  }

  /** Default model id for a provider (used when a request doesn't pin one). */
  static defaultModel(provider: ProviderName): string {
    return DEFAULT_MODEL_BY_PROVIDER[provider];
  }

  private static buildBase(
    name: ProviderName,
    config: ProviderFactoryConfig,
  ): AIProvider {
    switch (name) {
      case 'anthropic': {
        const key = config.anthropicApiKey;
        return key
          ? new ClaudeProvider(key, config.timeoutMs)
          : new UnconfiguredProvider('anthropic');
      }
      case 'openai': {
        const key = config.openaiApiKey;
        return key
          ? new OpenAIProvider(key, config.timeoutMs)
          : new UnconfiguredProvider('openai');
      }
      default: {
        // Exhaustiveness guard — a new ProviderName must be handled above.
        const exhaustive: never = name;
        return new UnconfiguredProvider(String(exhaustive));
      }
    }
  }
}
