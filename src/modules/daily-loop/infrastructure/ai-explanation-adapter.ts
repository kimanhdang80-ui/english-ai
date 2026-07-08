import type { Explanation } from '@/modules/daily-loop/domain/entities';
import type {
  ExplanationInput,
  ExplanationPort,
} from '@/modules/daily-loop/application/ports';

/** The subset of the AI module's text service this adapter depends on (no leaked internals). */
export interface WordExplainer {
  explainWord(input: {
    word: string;
    definition: string;
    example?: string | null;
  }): Promise<{ text: string; source: string }>;
}

/**
 * Real-AI explanation adapter — replaces `MockExplanationAdapter` on the daily loop's
 * `ExplanationPort`. Delegates to the AI module's public `AiTextService`, which itself
 * degrades to deterministic text if the provider is off/failing. `source` reflects
 * whether the text came from the provider (`ai`) or the fallback, for observability.
 */
export class AiExplanationAdapter implements ExplanationPort {
  readonly source = 'ai';

  constructor(private readonly explainer: WordExplainer) {}

  async explainWord(input: ExplanationInput): Promise<Explanation> {
    const result = await this.explainer.explainWord({
      word: input.word,
      definition: input.definition,
      example: input.example,
    });
    return { text: result.text, source: result.source };
  }
}
