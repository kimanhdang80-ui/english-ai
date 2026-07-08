import { DomainError } from '@/lib/errors';
import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';
import type { ProviderName } from '@/modules/ai/config/models';

/**
 * `AIProvider` is the vendor-agnostic seam every LLM vendor implements. It is
 * structurally a `LlmPort` (so it drops straight into the application container),
 * plus a `name` for telemetry. Concrete adapters: `ClaudeProvider`, `OpenAIProvider`.
 * Decorators (`RetryingProvider`, `LoggingProvider`, `FallbackProvider`) also implement
 * it, so resilience is composed without the services knowing.
 */
export interface AIProvider {
  readonly providerName: string;
  readonly configured: boolean;
  complete(input: LlmRequest): Promise<LlmCompletion>;
  /**
   * Optional token streaming (Server-Sent Events). Present on the base adapters
   * (Claude/OpenAI) and delegated by the decorators. Yields incremental text deltas.
   * Callers feature-detect (`if (provider.stream)`) — the learning UI does not use it yet.
   */
  stream?(input: LlmRequest): AsyncIterable<string>;
}

export type { ProviderName };

/** Base class for all provider failures — mapped to a graceful status at the boundary. */
export class ProviderError extends DomainError {
  constructor(
    message: string,
    code: string,
    /** Whether a retry could plausibly succeed (network/5xx/timeout/429). */
    readonly retryable: boolean,
    readonly provider: string,
  ) {
    super(message, code);
  }
}

/** The provider has no real API key configured. Never retryable. */
export class ProviderUnavailableError extends ProviderError {
  constructor(provider: string) {
    super(
      `AI provider "${provider}" is not configured.`,
      'AI_PROVIDER_UNAVAILABLE',
      false,
      provider,
    );
  }
}

/** The call exceeded the configured timeout. Retryable. */
export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string, timeoutMs: number) {
    super(
      `AI provider "${provider}" timed out after ${timeoutMs}ms.`,
      'AI_PROVIDER_TIMEOUT',
      true,
      provider,
    );
  }
}

/** The provider returned an error response (HTTP status or malformed body). */
export class ProviderResponseError extends ProviderError {
  constructor(provider: string, status: number, detail?: string) {
    super(
      `AI provider "${provider}" returned ${status}${detail ? `: ${detail}` : ''}.`,
      'AI_PROVIDER_ERROR',
      // 429 (rate limit) and 5xx are transient; 4xx (except 429) are not.
      status === 429 || status >= 500,
      provider,
    );
  }
}
