import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { ProviderUnavailableError, type AIProvider } from './types';

/**
 * Null-object provider used when no API key is configured. `configured` is false and
 * `complete()` throws `ProviderUnavailableError` — callers detect this and degrade to a
 * deterministic fallback (graceful degradation), so the app runs with AI switched off.
 */
export class UnconfiguredProvider implements AIProvider {
  readonly configured = false;

  constructor(readonly providerName: string = 'none') {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async complete(_input: LlmRequest): Promise<LlmCompletion> {
    throw new ProviderUnavailableError(this.providerName);
  }
}
