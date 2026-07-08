import { describe, expect, it } from 'vitest';

import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { FallbackProvider } from './fallback-provider';
import { ProviderResponseError, type AIProvider } from './types';

const REQ: LlmRequest = { prompt: 'hi', model: 'm', maxOutputTokens: 10 };

class Stub implements AIProvider {
  calls = 0;
  constructor(
    readonly providerName: string,
    readonly configured: boolean,
    private readonly behavior: 'ok' | 'fail',
  ) {}
  async complete(): Promise<LlmCompletion> {
    this.calls += 1;
    if (this.behavior === 'fail') {
      throw new ProviderResponseError(this.providerName, 500);
    }
    return { text: this.providerName, tokensIn: 1, tokensOut: 1 };
  }
}

describe('FallbackProvider', () => {
  it('uses the primary when it succeeds', async () => {
    const primary = new Stub('primary', true, 'ok');
    const secondary = new Stub('secondary', true, 'ok');
    const result = await new FallbackProvider(primary, secondary).complete(REQ);
    expect(result.text).toBe('primary');
    expect(secondary.calls).toBe(0);
  });

  it('falls back to the secondary when the primary fails', async () => {
    const primary = new Stub('primary', true, 'fail');
    const secondary = new Stub('secondary', true, 'ok');
    const result = await new FallbackProvider(primary, secondary).complete(REQ);
    expect(result.text).toBe('secondary');
    expect(primary.calls).toBe(1);
    expect(secondary.calls).toBe(1);
  });

  it('is configured when either provider is configured', () => {
    const off = new Stub('a', false, 'ok');
    const on = new Stub('b', true, 'ok');
    expect(new FallbackProvider(off, on).configured).toBe(true);
    expect(new FallbackProvider(off, off).configured).toBe(false);
  });
});
