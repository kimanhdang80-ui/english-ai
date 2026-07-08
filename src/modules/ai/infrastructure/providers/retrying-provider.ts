import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { ProviderError, type AIProvider } from './types';

export interface RetryOptions {
  maxRetries: number;
  /** Base backoff in ms; attempt N waits `baseDelayMs * 2^N`. */
  baseDelayMs?: number;
  /** Injectable sleep (tests pass a no-op) — keeps the decorator deterministic. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Decorator that retries the wrapped provider on **retryable** failures (timeouts, 429,
 * 5xx, network) with exponential backoff. Non-retryable errors (bad key, 4xx, unconfigured)
 * fail fast. Delegates `providerName`/`configured` so it is transparent to callers.
 */
export class RetryingProvider implements AIProvider {
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly inner: AIProvider,
    options: RetryOptions,
  ) {
    this.maxRetries = Math.max(0, options.maxRetries);
    this.baseDelayMs = options.baseDelayMs ?? 250;
    this.sleep = options.sleep ?? defaultSleep;
  }

  get providerName(): string {
    return this.inner.providerName;
  }

  get configured(): boolean {
    return this.inner.configured;
  }

  async complete(input: LlmRequest): Promise<LlmCompletion> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.inner.complete(input);
      } catch (error) {
        lastError = error;
        const retryable = error instanceof ProviderError && error.retryable;
        if (!retryable || attempt === this.maxRetries) break;
        await this.sleep(this.baseDelayMs * 2 ** attempt);
      }
    }
    throw lastError;
  }

  /**
   * Streams from the inner provider. Streams are NOT retried mid-flight (partial output
   * can't be safely replayed) — connection-time failures surface to the caller, which can
   * fall back or re-issue. Delegation keeps streaming available through the chain.
   */
  stream(input: LlmRequest): AsyncIterable<string> {
    if (!this.inner.stream) {
      throw new StreamingUnsupportedError(this.providerName);
    }
    return this.inner.stream(input);
  }
}

export class StreamingUnsupportedError extends ProviderError {
  constructor(provider: string) {
    super(
      `AI provider "${provider}" does not support streaming.`,
      'AI_STREAM_UNSUPPORTED',
      false,
      provider,
    );
  }
}
