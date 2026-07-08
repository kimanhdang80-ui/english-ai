import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { StreamingUnsupportedError } from './retrying-provider';
import { ProviderError, type AIProvider } from './types';

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  /** Consecutive failures that trip the breaker open. */
  failureThreshold: number;
  /** How long to stay open before allowing a trial call (ms). */
  cooldownMs: number;
  /** Injectable clock (tests pass a controllable one). */
  now?: () => number;
}

/**
 * When a provider has failed `failureThreshold` times in a row, the breaker **opens** and
 * short-circuits further calls (throwing immediately) until `cooldownMs` has elapsed —
 * this stops us from hammering a dead/rate-limited provider and lets the FallbackProvider
 * skip straight to the secondary. After the cooldown one trial call is allowed
 * (**half-open**); success **closes** the breaker, failure re-**opens** it.
 *
 * Wraps the retry decorator per base provider (breaker is OUTER: `Breaker(Retrying(base))`),
 * so all retries exhaust first and the breaker counts the whole call as one failure. When
 * open it throws `CircuitOpenError` (retryable=false) so the FallbackProvider skips straight
 * to the secondary. State is per-process (single instance); documented in AI_HEALTHCHECK.md.
 */
export class CircuitBreakerProvider implements AIProvider {
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;

  private consecutiveFailures = 0;
  private openedAt: number | null = null;

  constructor(
    private readonly inner: AIProvider,
    options: CircuitBreakerOptions,
  ) {
    this.failureThreshold = Math.max(1, options.failureThreshold);
    this.cooldownMs = Math.max(0, options.cooldownMs);
    this.now = options.now ?? (() => Date.now());
  }

  get providerName(): string {
    return this.inner.providerName;
  }

  get configured(): boolean {
    return this.inner.configured;
  }

  /** Current breaker state (for health checks / metrics). */
  get state(): CircuitState {
    if (this.openedAt === null) return 'closed';
    return this.now() - this.openedAt >= this.cooldownMs ? 'half_open' : 'open';
  }

  async complete(input: LlmRequest): Promise<LlmCompletion> {
    if (this.state === 'open') {
      throw new CircuitOpenError(this.providerName, this.cooldownMs);
    }
    try {
      const result = await this.inner.complete(input);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /** Streams through the breaker: open → short-circuit; otherwise count success/failure. */
  async *stream(input: LlmRequest): AsyncGenerator<string> {
    if (this.state === 'open') {
      throw new CircuitOpenError(this.providerName, this.cooldownMs);
    }
    if (!this.inner.stream) {
      throw new StreamingUnsupportedError(this.providerName);
    }
    try {
      for await (const chunk of this.inner.stream(input)) yield chunk;
      this.recordSuccess();
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = null;
  }

  private recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.openedAt = this.now();
    }
  }
}

/** Thrown when the breaker is open — non-retryable so it falls through to fallback. */
export class CircuitOpenError extends ProviderError {
  constructor(provider: string, cooldownMs: number) {
    super(
      `AI provider "${provider}" circuit is open (cooldown ${cooldownMs}ms).`,
      'AI_CIRCUIT_OPEN',
      false,
      provider,
    );
  }
}
