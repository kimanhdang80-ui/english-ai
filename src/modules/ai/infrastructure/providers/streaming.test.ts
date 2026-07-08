import { describe, expect, it } from 'vitest';

import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { CircuitBreakerProvider } from './circuit-breaker-provider';
import { FallbackProvider } from './fallback-provider';
import { RetryingProvider } from './retrying-provider';
import { parseSseBuffer } from './streaming';
import { ProviderResponseError, type AIProvider } from './types';

const REQ: LlmRequest = { prompt: 'hi', model: 'm', maxOutputTokens: 10 };

async function collect(stream: AsyncIterable<string>): Promise<string> {
  let out = '';
  for await (const chunk of stream) out += chunk;
  return out;
}

/** Fake provider that streams the given chunks (optionally failing before the first). */
class StreamingProvider implements AIProvider {
  readonly configured = true;
  constructor(
    readonly providerName: string,
    private readonly chunks: string[],
    private readonly failAtConnect = false,
  ) {}
  async complete(): Promise<LlmCompletion> {
    return { text: this.chunks.join(''), tokensIn: 1, tokensOut: 1 };
  }
  async *stream(): AsyncGenerator<string> {
    if (this.failAtConnect) {
      throw new ProviderResponseError(this.providerName, 500);
    }
    for (const c of this.chunks) yield c;
  }
}

describe('parseSseBuffer', () => {
  it('extracts complete data events and keeps the partial tail', () => {
    const { events, rest } = parseSseBuffer('data: a\n\ndata: b\n\ndata: par');
    expect(events).toEqual(['a', 'b']);
    expect(rest).toBe('data: par');
  });

  it('ignores [DONE] and blank events, joins multi-line data', () => {
    const { events } = parseSseBuffer(
      'data: line1\ndata: line2\n\ndata: [DONE]\n\n',
    );
    expect(events).toEqual(['line1\nline2']);
  });

  it('handles CRLF framing', () => {
    const { events } = parseSseBuffer('data: x\r\n\r\ndata: y\r\n\r\n');
    expect(events).toEqual(['x', 'y']);
  });
});

describe('streaming through decorators', () => {
  it('RetryingProvider delegates streaming to the inner provider', async () => {
    const inner = new StreamingProvider('p', ['He', 'llo']);
    const retrying = new RetryingProvider(inner, { maxRetries: 2 });
    expect(await collect(retrying.stream(REQ))).toBe('Hello');
  });

  it('CircuitBreakerProvider streams and records success', async () => {
    const inner = new StreamingProvider('p', ['a', 'b', 'c']);
    const breaker = new CircuitBreakerProvider(inner, {
      failureThreshold: 2,
      cooldownMs: 1000,
      now: () => 0,
    });
    expect(await collect(breaker.stream(REQ))).toBe('abc');
    expect(breaker.state).toBe('closed');
  });

  it('FallbackProvider streams the primary when it connects', async () => {
    const primary = new StreamingProvider('primary', ['1', '2']);
    const secondary = new StreamingProvider('secondary', ['x', 'y']);
    const fallback = new FallbackProvider(primary, secondary);
    expect(await collect(fallback.stream(REQ))).toBe('12');
  });

  it('FallbackProvider falls back to the secondary on connect-time failure', async () => {
    const primary = new StreamingProvider('primary', ['1', '2'], true);
    const secondary = new StreamingProvider('secondary', ['x', 'y']);
    const fallback = new FallbackProvider(primary, secondary);
    expect(await collect(fallback.stream(REQ))).toBe('xy');
  });
});
