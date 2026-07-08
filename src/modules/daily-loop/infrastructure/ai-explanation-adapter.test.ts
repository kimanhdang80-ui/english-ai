import { describe, expect, it } from 'vitest';

import {
  AiExplanationAdapter,
  type WordExplainer,
} from './ai-explanation-adapter';

describe('AiExplanationAdapter', () => {
  it('returns the AI text and propagates the source', async () => {
    const explainer: WordExplainer = {
      async explainWord() {
        return { text: 'Apple is a fruit.', source: 'ai' };
      },
    };
    const adapter = new AiExplanationAdapter(explainer);
    const result = await adapter.explainWord({
      word: 'apple',
      definition: 'a round fruit',
      example: 'I eat an apple.',
    });
    expect(result.text).toBe('Apple is a fruit.');
    expect(result.source).toBe('ai');
  });

  it('surfaces the fallback source when the explainer degraded', async () => {
    const explainer: WordExplainer = {
      async explainWord({ word }) {
        return { text: `“${word}” means a round fruit.`, source: 'fallback' };
      },
    };
    const adapter = new AiExplanationAdapter(explainer);
    const result = await adapter.explainWord({
      word: 'apple',
      definition: 'a round fruit',
    });
    expect(result.source).toBe('fallback');
  });
});
