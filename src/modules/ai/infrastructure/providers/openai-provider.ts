import type { LlmCompletion, LlmRequest } from '@/modules/ai/domain/entities';

import { readSseData } from './streaming';
import {
  ProviderResponseError,
  ProviderTimeoutError,
  type AIProvider,
} from './types';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

interface OpenAiStreamChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

/**
 * OpenAI adapter (Chat Completions API) over `fetch`. Same contract as `ClaudeProvider`
 * so the two are interchangeable via `ProviderFactory`/config. Key injected from config;
 * never logged. Extending to Gemini later is a third adapter of the same shape.
 */
export class OpenAIProvider implements AIProvider {
  readonly providerName = 'openai';
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
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
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

      const data = (await response.json()) as OpenAiResponse;
      const text = (data.choices?.[0]?.message?.content ?? '').trim();

      return {
        text,
        tokensIn: data.usage?.prompt_tokens ?? 0,
        tokensOut: data.usage?.completion_tokens ?? 0,
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

  /** Streams text deltas from Chat Completions (`stream: true`, SSE). */
  async *stream(input: LlmRequest): AsyncGenerator<string> {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
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
      let chunk: OpenAiStreamChunk;
      try {
        chunk = JSON.parse(data) as OpenAiStreamChunk;
      } catch {
        continue;
      }
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}

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
