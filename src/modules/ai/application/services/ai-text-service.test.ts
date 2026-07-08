import { describe, expect, it } from 'vitest';

import type {
  AiUsageLogEntry,
  LlmCompletion,
  LlmRequest,
} from '@/modules/ai/domain/entities';
import { ContentValidator } from '@/modules/ai/domain/content-validator';
import { PromptRenderer } from '@/modules/ai/domain/prompt-renderer';
import { PROMPT_TEMPLATE_REGISTRY } from '@/modules/ai/config/prompt-templates';
import { InMemoryPromptTemplateRepository } from '@/modules/ai/infrastructure/repositories';
import type {
  AiUsageLogRepository,
  LlmPort,
} from '@/modules/ai/application/ports';

import { AiTextService } from './ai-text-service';
import { ContentValidatorService } from './content-validator-service';
import { PromptBuilder } from './prompt-builder';

class RecordingUsageLog implements AiUsageLogRepository {
  entries: AiUsageLogEntry[] = [];
  async append(entry: AiUsageLogEntry): Promise<void> {
    this.entries.push(entry);
  }
}

class FakeLlm implements LlmPort {
  readonly providerName = 'fake';
  lastRequest: LlmRequest | null = null;
  constructor(
    readonly configured: boolean,
    private readonly behavior:
      { kind: 'text'; text: string } | { kind: 'throw'; error: Error },
  ) {}
  async complete(input: LlmRequest): Promise<LlmCompletion> {
    this.lastRequest = input;
    if (this.behavior.kind === 'throw') throw this.behavior.error;
    return { text: this.behavior.text, tokensIn: 5, tokensOut: 7 };
  }
}

function makeService(llm: LlmPort) {
  const usage = new RecordingUsageLog();
  const service = new AiTextService(
    new InMemoryPromptTemplateRepository(PROMPT_TEMPLATE_REGISTRY),
    llm,
    new PromptBuilder(new PromptRenderer()),
    new ContentValidatorService(new ContentValidator()),
    usage,
    () => new Date('2026-07-01T00:00:00.000Z'),
    () => 0,
  );
  return { service, usage };
}

const wordInput = {
  word: 'apple',
  definition: 'a round fruit',
  example: 'I eat an apple.',
  level: 'A1',
};

describe('AiTextService — provider unconfigured', () => {
  it('returns deterministic fallback and logs a fallback entry', async () => {
    const { service, usage } = makeService(
      new FakeLlm(false, { kind: 'text', text: 'unused' }),
    );
    const result = await service.explainWord(wordInput);
    expect(result.source).toBe('fallback');
    expect(result.text).toContain('apple');
    expect(usage.entries).toHaveLength(1);
    expect(usage.entries[0]?.status).toBe('fallback');
    expect(usage.entries[0]?.feature).toBe('vocabulary_explanation');
  });
});

describe('AiTextService — provider configured', () => {
  it('returns provider text (source ai) and logs success with tokens', async () => {
    const { service, usage } = makeService(
      new FakeLlm(true, {
        kind: 'text',
        text: '  Apple is a fruit you eat.  ',
      }),
    );
    const result = await service.explainWord(wordInput);
    expect(result.source).toBe('ai');
    expect(result.text).toBe('Apple is a fruit you eat.');
    expect(usage.entries[0]?.status).toBe('success');
    expect(usage.entries[0]?.tokensOut).toBe(7);
    expect(usage.entries[0]?.provider).toBe('fake');
  });

  it('falls back and logs failed when the provider throws', async () => {
    const { service, usage } = makeService(
      new FakeLlm(true, { kind: 'throw', error: new Error('boom') }),
    );
    const result = await service.explainWord(wordInput);
    expect(result.source).toBe('fallback');
    expect(usage.entries[0]?.status).toBe('failed');
  });

  it('generates an example and passes the word to the provider', async () => {
    const { service } = makeService(
      new FakeLlm(true, { kind: 'text', text: 'I bought an apple today.' }),
    );
    const result = await service.generateExample({
      word: 'apple',
      level: 'A1',
    });
    expect(result.source).toBe('ai');
    expect(result.text).toBe('I bought an apple today.');
  });

  it('feedback fallback grades a wrong short answer deterministically', async () => {
    const { service } = makeService(
      new FakeLlm(false, { kind: 'text', text: 'unused' }),
    );
    const result = await service.feedbackOnShortAnswer({
      question: 'opposite of big?',
      expected: 'small',
      answer: 'tall',
    });
    expect(result.source).toBe('fallback');
    expect(result.text).toContain('small');
  });
});
