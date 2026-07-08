import { NotImplementedError } from '@/lib/errors';
import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import type { LlmPort } from '@/modules/ai/application/ports';

/**
 * Stub LLM adapter — the provider seam with **no** real provider (Sprint 7.1).
 * `complete()` throws NotImplementedError (→ HTTP 501). A real Claude/OpenAI adapter
 * implements the same `LlmPort` and is swapped in via the container, with no changes to
 * the domain or services.
 */
export class StubLlmAdapter implements LlmPort {
  readonly providerName = 'stub';
  readonly configured = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async complete(_input: LlmRequest): Promise<LlmCompletion> {
    throw new NotImplementedError(
      'LLM provider not configured (foundation only)',
    );
  }
}
