import { describe, expect, it } from 'vitest';

import {
  NotFoundError,
  NotImplementedError,
  ValidationError,
} from '@/lib/errors';
import { ContentValidator } from '@/modules/ai/domain/content-validator';
import { DifficultyAdjuster } from '@/modules/ai/domain/difficulty-adjuster';
import { PromptRenderer } from '@/modules/ai/domain/prompt-renderer';
import { PROMPT_TEMPLATE_REGISTRY } from '@/modules/ai/config/prompt-templates';
import {
  InMemoryGenerationHistoryRepository,
  InMemoryPromptTemplateRepository,
} from '@/modules/ai/infrastructure/repositories';
import { StubLlmAdapter } from '@/modules/ai/infrastructure/stub-llm-adapter';

import { ContentValidatorService } from './content-validator-service';
import { DifficultyService } from './difficulty-service';
import { LessonGeneratorService } from './lesson-generator-service';
import { PromptBuilder } from './prompt-builder';
import { TokenEstimator } from './token-estimator';

function makeService() {
  const templates = new InMemoryPromptTemplateRepository(
    PROMPT_TEMPLATE_REGISTRY,
  );
  const history = new InMemoryGenerationHistoryRepository();
  const service = new LessonGeneratorService(
    templates,
    history,
    new StubLlmAdapter(),
    new PromptBuilder(new PromptRenderer()),
    new ContentValidatorService(new ContentValidator()),
    new DifficultyService(new DifficultyAdjuster()),
    new TokenEstimator(),
  );
  return { service, history };
}

const validRequest = {
  templateKey: 'vocabulary-lesson',
  variables: {
    WORD: 'apple',
    LEVEL: 'A1',
    LANGUAGE: 'Vietnamese',
    GOAL: 'everyday conversation',
    STYLE: 'friendly',
  },
};

describe('LessonGeneratorService.preview (no AI)', () => {
  it('renders + validates a prompt and returns a preview', async () => {
    const { service } = makeService();
    const result = await service.preview(validRequest);
    expect(result.status).toBe('previewed');
    expect(result.renderedPrompt).toContain('apple');
    expect(result.renderedPrompt).not.toContain('{{');
    expect(result.promptValidation.valid).toBe(true);
    expect(result.estimatedInputTokens).toBeGreaterThan(0);
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.difficulty.level).toBe('A1');
    expect(result.estimatedOutputTokens).toBe(500);
  });

  it('throws ValidationError when a required variable is missing', async () => {
    const { service } = makeService();
    await expect(
      service.preview({
        templateKey: 'vocabulary-lesson',
        variables: { LEVEL: 'A1', LANGUAGE: 'Vietnamese' }, // no WORD
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws NotFoundError for an unknown template', async () => {
    const { service } = makeService();
    await expect(
      service.preview({ templateKey: 'nope', variables: {} }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('LessonGeneratorService.generate (stub provider)', () => {
  it('throws NotImplementedError and writes no history', async () => {
    const { service, history } = makeService();
    await expect(service.generate(validRequest)).rejects.toBeInstanceOf(
      NotImplementedError,
    );
    expect(await history.list(10)).toEqual([]);
  });
});
