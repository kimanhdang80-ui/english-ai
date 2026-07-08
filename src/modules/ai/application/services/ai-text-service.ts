import type {
  AiCapability,
  AiCallStatus,
  LlmRequest,
} from '@/modules/ai/domain/entities';
import { computeCostMicroUsd } from '@/modules/ai/config/pricing';
import { DomainError } from '@/lib/errors';

import type {
  AiUsageLogRepository,
  LlmPort,
  PromptTemplateRepository,
} from '@/modules/ai/application/ports';
import { ContentValidatorService } from './content-validator-service';
import { PromptBuilder } from './prompt-builder';

/** Whether the returned text came from the provider or the deterministic fallback. */
export type AiTextSource = 'ai' | 'fallback';

export interface AiText {
  text: string;
  source: AiTextSource;
}

export interface ExplainWordInput {
  word: string;
  definition: string;
  example?: string | null;
  level?: string;
  language?: string;
  userId?: string | null;
}

export interface GenerateExampleInput {
  word: string;
  level?: string;
  userId?: string | null;
}

export interface ShortAnswerFeedbackInput {
  question: string;
  expected: string;
  answer: string;
  level?: string;
  language?: string;
  userId?: string | null;
}

interface CapabilityRun {
  feature: AiCapability;
  templateKey: string;
  variables: Record<string, string>;
  fallback: () => string;
  userId?: string | null;
}

/**
 * Real-AI capabilities that replace the Sprint-7.1 mocks: vocabulary **explanation**,
 * example **generation**, and short-answer **feedback**. Each renders a versioned
 * prompt template (prompts-as-data), calls the provider-agnostic `LlmPort`, validates
 * output, and logs telemetry. If the provider is unconfigured or the call fails, it
 * degrades to a deterministic fallback so the learning loop never breaks.
 */
export class AiTextService {
  constructor(
    private readonly templates: PromptTemplateRepository,
    private readonly llm: LlmPort,
    private readonly builder: PromptBuilder,
    private readonly validator: ContentValidatorService,
    private readonly usageLog: AiUsageLogRepository,
    private readonly clock: () => Date = () => new Date(),
    private readonly monotonic: () => number = () => Date.now(),
  ) {}

  async explainWord(input: ExplainWordInput): Promise<AiText> {
    const meaning = input.definition.trim().replace(/\.$/, '');
    return this.run({
      feature: 'vocabulary_explanation',
      templateKey: 'vocabulary-explanation',
      userId: input.userId,
      variables: {
        WORD: input.word,
        DEFINITION: input.definition,
        EXAMPLE: input.example ?? '',
        LEVEL: input.level ?? 'A1',
        LANGUAGE: input.language ?? '',
      },
      fallback: () => {
        const base = `“${input.word}” means ${meaning.toLowerCase()}.`;
        return input.example ? `${base} For example: ${input.example}` : base;
      },
    });
  }

  async generateExample(input: GenerateExampleInput): Promise<AiText> {
    return this.run({
      feature: 'example_generation',
      templateKey: 'vocabulary-example',
      userId: input.userId,
      variables: { WORD: input.word, LEVEL: input.level ?? 'A1' },
      fallback: () => `I am learning the word “${input.word}” today.`,
    });
  }

  async feedbackOnShortAnswer(
    input: ShortAnswerFeedbackInput,
  ): Promise<AiText> {
    const isCorrect =
      input.answer.trim().toLowerCase() === input.expected.trim().toLowerCase();
    return this.run({
      feature: 'short_answer_feedback',
      templateKey: 'short-answer-feedback',
      userId: input.userId,
      variables: {
        QUESTION: input.question,
        EXPECTED: input.expected,
        ANSWER: input.answer,
        LEVEL: input.level ?? 'A1',
        LANGUAGE: input.language ?? '',
      },
      fallback: () =>
        isCorrect
          ? 'Correct! Well done.'
          : `Not quite — the expected answer is “${input.expected}”. Keep practicing!`,
    });
  }

  /**
   * Shared pipeline: render template → call provider → validate → log. Any failure
   * (unconfigured provider, provider error, invalid output) falls back to deterministic
   * text and is recorded as a `fallback`/`failed` usage log — never thrown at the caller.
   */
  private async run(run: CapabilityRun): Promise<AiText> {
    if (!this.llm.configured) {
      await this.log(run, 'fallback', 0, 0, 0, 'provider_unconfigured');
      return { text: run.fallback(), source: 'fallback' };
    }

    const template = await this.templates.findByKey(run.templateKey);
    const version = template
      ? await this.templates.getActiveVersion(template.id)
      : null;
    if (!template || !version) {
      await this.log(run, 'fallback', 0, 0, 0, 'template_missing');
      return { text: run.fallback(), source: 'fallback' };
    }

    const built = this.builder.build(template, version, run.variables);
    if (built.missingRequired.length > 0) {
      await this.log(run, 'fallback', 0, 0, 0, 'missing_variables');
      return { text: run.fallback(), source: 'fallback' };
    }

    const request: LlmRequest = {
      prompt: built.rendered,
      model: version.model,
      maxOutputTokens: version.maxOutputTokens,
    };

    const startedAt = this.monotonic();
    try {
      const completion = await this.llm.complete(request);
      const latency = this.monotonic() - startedAt;
      const validation = this.validator.validateOutput(completion.text, {
        maxTokens: version.maxOutputTokens,
      });
      if (!validation.valid || completion.text.trim().length === 0) {
        await this.log(
          run,
          'fallback',
          latency,
          completion.tokensIn,
          completion.tokensOut,
          'invalid_output',
          version.model,
        );
        return { text: run.fallback(), source: 'fallback' };
      }
      await this.log(
        run,
        'success',
        latency,
        completion.tokensIn,
        completion.tokensOut,
        null,
        version.model,
      );
      return { text: completion.text.trim(), source: 'ai' };
    } catch (error) {
      const latency = this.monotonic() - startedAt;
      const code = error instanceof DomainError ? error.code : 'provider_error';
      await this.log(run, 'failed', latency, 0, 0, code, version.model);
      return { text: run.fallback(), source: 'fallback' };
    }
  }

  private async log(
    run: CapabilityRun,
    status: AiCallStatus,
    latencyMs: number,
    tokensIn: number,
    tokensOut: number,
    errorCode: string | null,
    model = 'none',
  ): Promise<void> {
    await this.usageLog.append({
      feature: run.feature,
      provider: this.llm.providerName,
      model,
      tokensIn,
      tokensOut,
      costMicroUsd: computeCostMicroUsd(model, tokensIn, tokensOut),
      latencyMs: Math.max(0, Math.round(latencyMs)),
      status,
      cacheHit: false,
      userId: run.userId ?? null,
      errorCode,
      occurredAt: this.clock().toISOString(),
    });
  }
}
