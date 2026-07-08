import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { readSseData } from './streaming';
import {
  ProviderResponseError,
  ProviderTimeoutError,
  type AIProvider,
} from './types';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

interface AnthropicStreamEvent {
  type?: string;
  delta?: { type?: string; text?: string };
}

/**
 * Anthropic Claude adapter (Messages API) over `fetch` — no vendor SDK, so no new
 * dependency and full control of the timeout. The API key is injected from config
 * (never read from `process.env` here) and never logged. Implements `AIProvider`.
 */
export class ClaudeProvider implements AIProvider {
  readonly providerName = 'anthropic';
  readonly configured: boolean;

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
  ) {
    this.configured = apiKey.length > 0;
  }

  async complete(input: LlmRequest): Promise<LlmCompletion> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(ANTHROPIC_MESSAGES_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: input.model,
          max_tokens: input.maxOutputTokens,
          messages: [{ role: 'user', content: input.prompt }],
        }),
      });

      if (!response.ok) {
        const detail = await safeErrorDetail(response);
        throw new ProviderResponseError(
          this.providerName,
          response.status,
          detail,
        );
      }

      const data = (await response.json()) as AnthropicResponse;
      const text = (data.content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text ?? '')
        .join('')
        .trim();

      return {
        text,
        tokensIn: data.usage?.input_tokens ?? 0,
        tokensOut: data.usage?.output_tokens ?? 0,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderTimeoutError(this.providerName, this.timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Streams text deltas from the Messages API (`stream: true`, SSE). */
  async *stream(input: LlmRequest): AsyncGenerator<string> {
    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxOutputTokens,
        stream: true,
        messages: [{ role: 'user', content: input.prompt }],
      }),
    });

    if (!response.ok || !response.body) {
      const detail = await safeErrorDetail(response);
      throw new ProviderResponseError(
        this.providerName,
        response.status,
        detail,
      );
    }

    for await (const data of readSseData(response.body)) {
      let event: AnthropicStreamEvent;
      try {
        event = JSON.parse(data) as AnthropicStreamEvent;
      } catch {
        continue;
      }
      if (event.type === 'content_block_delta' && event.delta?.text) {
        yield event.delta.text;
      }
    }
  }
}

/** Best-effort extraction of a provider error message without leaking secrets. */
async function safeErrorDetail(
  response: Response,
): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message;
  } catch {
    return undefined;
  }
}
