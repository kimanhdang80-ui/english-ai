import { describe, expect, it } from 'vitest';

import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import {
  CircuitBreakerProvider,
  CircuitOpenError,
} from './circuit-breaker-provider';
import { ProviderResponseError, type AIProvider } from './types';

const REQUEST: LlmRequest = { prompt: 'hi', model: 'm', maxOutputTokens: 10 };
const OK: LlmCompletion = { text: 'ok', tokensIn: 1, tokensOut: 1 };

/** Fake provider whose next result is controllable per call. */
class ScriptedProvider implements AIProvider {
  readonly providerName = 'fake';
  readonly configured = true;
  calls = 0;
  constructor(private readonly script: Array<'ok' | 'fail'>) {}
  async complete(): Promise<LlmCompletion> {
    const outcome = this.script[this.calls] ?? 'ok';
    this.calls += 1;
    if (outcome === 'fail') {
      throw new ProviderResponseError(this.providerName, 500);
    }
    return OK;
  }
}

describe('CircuitBreakerProvider', () => {
  it('opens after the failure threshold and short-circuits further calls', async () => {
    const inner = new ScriptedProvider(['fail', 'fail', 'fail']);
    const breaker = new CircuitBreakerProvider(inner, {
      failureThreshold: 3,
      cooldownMs: 1000,
      now: () => 0,
    });

    for (let i = 0; i < 3; i++) {
      await expect(breaker.complete(REQUEST)).rejects.toBeInstanceOf(
        ProviderResponseError,
      );
    }
    expect(breaker.state).toBe('open');

    // Now short-circuits without touching the inner provider.
    await expect(breaker.complete(REQUEST)).rejects.toBeInstanceOf(
      CircuitOpenError,
    );
    expect(inner.calls).toBe(3);
  });

  it('resets the failure count on a success (stays closed)', async () => {
    const inner = new ScriptedProvider(['fail', 'fail', 'ok', 'fail']);
    const breaker = new CircuitBreakerProvider(inner, {
      failureThreshold: 3,
      cooldownMs: 1000,
      now: () => 0,
    });

    await expect(breaker.complete(REQUEST)).rejects.toThrow();
    await expect(breaker.complete(REQUEST)).rejects.toThrow();
    await expect(breaker.complete(REQUEST)).resolves.toEqual(OK); // resets
    await expect(breaker.complete(REQUEST)).rejects.toThrow(); // 1 failure only
    expect(breaker.state).toBe('closed');
  });

  it('half-opens after the cooldown, then closes on a trial success', async () => {
    let now = 0;
    const inner = new ScriptedProvider(['fail', 'fail', 'ok']);
    const breaker = new CircuitBreakerProvider(inner, {
      failureThreshold: 2,
      cooldownMs: 1000,
      now: () => now,
    });

    await expect(breaker.complete(REQUEST)).rejects.toThrow();
    await expect(breaker.complete(REQUEST)).rejects.toThrow();
    expect(breaker.state).toBe('open');

    now = 1000; // cooldown elapsed
    expect(breaker.state).toBe('half_open');

    await expect(breaker.complete(REQUEST)).resolves.toEqual(OK);
    expect(breaker.state).toBe('closed');
  });
});
