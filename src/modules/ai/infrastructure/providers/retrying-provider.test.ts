import { describe, expect, it } from 'vitest';

import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { RetryingProvider } from './retrying-provider';
import {
  ProviderResponseError,
  ProviderUnavailableError,
  type AIProvider,
} from './types';

const REQ: LlmRequest = { prompt: 'hi', model: 'm', maxOutputTokens: 10 };
const OK: LlmCompletion = { text: 'ok', tokensIn: 1, tokensOut: 1 };

/** Provider that fails `failures` times (with `error`) then succeeds. */
class FlakyProvider implements AIProvider {
  readonly providerName = 'flaky';
  readonly configured = true;
  calls = 0;
  constructor(
    private failures: number,
    private readonly error: Error,
  ) {}
  async complete(): Promise<LlmCompletion> {
    this.calls += 1;
    if (this.failures > 0) {
      this.failures -= 1;
      throw this.error;
    }
    return OK;
  }
}

const noSleep = async () => {};

describe('RetryingProvider', () => {
  it('retries a retryable error and eventually succeeds', async () => {
    const inner = new FlakyProvider(2, new ProviderResponseError('flaky', 503));
    const provider = new RetryingProvider(inner, {
      maxRetries: 3,
      sleep: noSleep,
    });
    const result = await provider.complete(REQ);
    expect(result).toEqual(OK);
    expect(inner.calls).toBe(3); // 2 failures + 1 success
  });

  it('exhausts retries and throws the last error', async () => {
    const inner = new FlakyProvider(
      99,
      new ProviderResponseError('flaky', 500),
    );
    const provider = new RetryingProvider(inner, {
      maxRetries: 2,
      sleep: noSleep,
    });
    await expect(provider.complete(REQ)).rejects.toBeInstanceOf(
      ProviderResponseError,
    );
    expect(inner.calls).toBe(3); // initial + 2 retries
  });

  it('does not retry a non-retryable error', async () => {
    const inner = new FlakyProvider(99, new ProviderUnavailableError('flaky'));
    const provider = new RetryingProvider(inner, {
      maxRetries: 5,
      sleep: noSleep,
    });
    await expect(provider.complete(REQ)).rejects.toBeInstanceOf(
      ProviderUnavailableError,
    );
    expect(inner.calls).toBe(1); // fails fast
  });

  it('delegates providerName and configured', () => {
    const inner = new FlakyProvider(0, new Error('x'));
    const provider = new RetryingProvider(inner, { maxRetries: 0 });
    expect(provider.providerName).toBe('flaky');
    expect(provider.configured).toBe(true);
  });
});
