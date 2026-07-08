import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { ProviderError, type AIProvider } from './types';

/**
 * Decorator that routes to a primary provider and, on failure, to a secondary one
 * (e.g. Anthropic → OpenAI). This is provider-level graceful fallback; capability-level
 * fallback (to deterministic text) still happens above, in the services. `configured`
 * is true if either provider is configured.
 */
export class FallbackProvider implements AIProvider {
  readonly providerName: string;

  constructor(
    private readonly primary: AIProvider,
    private readonly secondary: AIProvider,
  ) {
    this.providerName = `${primary.providerName}->${secondary.providerName}`;
  }

  get configured(): boolean {
    return this.primary.configured || this.secondary.configured;
  }

  async complete(input: LlmRequest): Promise<LlmCompletion> {
    try {
      return await this.primary.complete(input);
    } catch {
      return this.secondary.complete(input);
    }
  }

  /**
   * Streams from the primary; if it fails **before the first chunk** (connect-time), falls
   * back to the secondary. Once bytes have streamed we do NOT switch (partial output can't
   * be replayed) — those errors propagate. Full mid-stream resilience is a future item.
   */
  async *stream(input: LlmRequest): AsyncGenerator<string> {
    const primaryStream = this.primary.stream?.(input);
    if (primaryStream) {
      const iterator = primaryStream[Symbol.asyncIterator]();
      let first: IteratorResult<string> | null = null;
      try {
        first = await iterator.next();
      } catch {
        first = null; // connect-time failure → fall back to secondary
      }
      if (first) {
        if (!first.done) yield first.value;
        for (;;) {
          const next = await iterator.next();
          if (next.done) break;
          yield next.value;
        }
        return;
      }
    }

    const secondaryStream = this.secondary.stream?.(input);
    if (!secondaryStream) {
      throw new ProviderError(
        'No streaming provider available.',
        'AI_STREAM_UNAVAILABLE',
        false,
        this.providerName,
      );
    }
    yield* secondaryStream;
  }
}
