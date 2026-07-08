import { describe, expect, it } from 'vitest';

import { CircuitBreakerProvider } from './circuit-breaker-provider';
import { ClaudeProvider } from './claude-provider';
import { FallbackProvider } from './fallback-provider';
import { OpenAIProvider } from './openai-provider';
import {
  ProviderFactory,
  type ProviderFactoryConfig,
} from './provider-factory';

const base: ProviderFactoryConfig = {
  provider: 'anthropic',
  fallbackProvider: 'none',
  anthropicApiKey: '',
  openaiApiKey: '',
  timeoutMs: 1000,
  maxRetries: 2,
  circuitFailureThreshold: 5,
  circuitCooldownMs: 30_000,
};

/** Follows the `.inner` decorator chain down to the base adapter (test-only). */
function unwrapDeep(provider: unknown): unknown {
  let current = provider;
  while (current && (current as { inner?: unknown }).inner) {
    current = (current as { inner?: unknown }).inner;
  }
  return current;
}

describe('ProviderFactory', () => {
  it('builds a circuit-broken, retrying Claude provider when anthropic is selected + keyed', () => {
    const p = ProviderFactory.create({ ...base, anthropicApiKey: 'sk-ant-x' });
    expect(p).toBeInstanceOf(CircuitBreakerProvider);
    expect(p.providerName).toBe('anthropic');
    expect(p.configured).toBe(true);
    expect(unwrapDeep(p)).toBeInstanceOf(ClaudeProvider);
  });

  it('builds a circuit-broken, retrying OpenAI provider when openai is selected + keyed', () => {
    const p = ProviderFactory.create({
      ...base,
      provider: 'openai',
      openaiApiKey: 'sk-openai-x',
    });
    expect(p.providerName).toBe('openai');
    expect(p.configured).toBe(true);
    expect(unwrapDeep(p)).toBeInstanceOf(OpenAIProvider);
  });

  it('reports not-configured when the selected provider has no key', () => {
    const p = ProviderFactory.create(base);
    expect(p.configured).toBe(false);
  });

  it('wraps in a fallback chain when a fallback provider is configured', () => {
    const p = ProviderFactory.create({
      ...base,
      anthropicApiKey: 'sk-ant-x',
      fallbackProvider: 'openai',
      openaiApiKey: 'sk-openai-x',
    });
    expect(p).toBeInstanceOf(FallbackProvider);
    expect(p.providerName).toBe('anthropic->openai');
    expect(p.configured).toBe(true);
  });

  it('exposes the default model per provider', () => {
    expect(ProviderFactory.defaultModel('anthropic')).toBe('claude-sonnet-4-6');
    expect(ProviderFactory.defaultModel('openai')).toBe('gpt-4o-mini');
  });
});
