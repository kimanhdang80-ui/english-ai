import { NotFoundError, ValidationError } from '@/lib/errors';
import type {
  GenerationRequest,
  GenerationResult,
} from '@/modules/ai/domain/entities';

import type {
  GenerationHistoryRepository,
  LlmPort,
  PromptTemplateRepository,
} from '@/modules/ai/application/ports';
import { ContentValidatorService } from './content-validator-service';
import { DifficultyService } from './difficulty-service';
import { PromptBuilder } from './prompt-builder';
import { TokenEstimator } from './token-estimator';

/**
 * Orchestrates lesson generation. `preview()` renders + validates a prompt with NO
 * provider call (fully usable in the foundation). `generate()` additionally calls the
 * `LlmPort`; in Sprint 7.1 the port is a stub that throws NotImplementedError, so no
 * AI is invoked — the seam simply exists and returns a graceful status.
 */
export class LessonGeneratorService {
  constructor(
    private readonly templates: PromptTemplateRepository,
    private readonly history: GenerationHistoryRepository,
    private readonly llm: LlmPort,
    private readonly builder: PromptBuilder,
    private readonly validator: ContentValidatorService,
    private readonly difficulty: DifficultyService,
    private readonly tokens: TokenEstimator,
  ) {}

  /** Render + validate a prompt for a request. No provider is called. */
  async preview(request: GenerationRequest): Promise<GenerationResult> {
    const template = await this.templates.findByKey(request.templateKey);
    if (!template)
      throw new NotFoundError('PromptTemplate', request.templateKey);

    const version = await this.templates.getActiveVersion(template.id);
    if (!version) {
      throw new ValidationError(
        `No active version for template "${request.templateKey}".`,
      );
    }

    const built = this.builder.build(template, version, request.variables);
    if (built.missingRequired.length > 0) {
      throw new ValidationError('Missing required variables.', {
        missing: built.missingRequired,
      });
    }

    const promptValidation = this.validator.validatePrompt(built.rendered);
    const level = request.level ?? request.variables.LEVEL ?? 'A1';
    const profile = this.difficulty.profileFor(level);

    return {
      templateKey: request.templateKey,
      status: 'previewed',
      model: version.model,
      renderedPrompt: built.rendered,
      estimatedInputTokens: this.tokens.estimate(built.rendered),
      estimatedOutputTokens: version.maxOutputTokens,
      difficulty: profile,
      promptValidation,
    };
  }

  /**
   * Full generation. Builds via `preview()`, then calls the provider. With the stub
   * adapter this throws NotImplementedError (→ HTTP 501). When a real adapter is wired,
   * the output is validated and appended to history.
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const preview = await this.preview(request);

    const completion = await this.llm.complete({
      prompt: preview.renderedPrompt,
      model: preview.model,
      maxOutputTokens: preview.estimatedOutputTokens,
    });

    const outputValidation = this.validator.validateOutput(completion.text, {
      maxTokens: preview.estimatedOutputTokens,
    });

    const result: GenerationResult = {
      ...preview,
      status: outputValidation.valid ? 'completed' : 'failed',
      output: completion.text,
      outputValidation,
    };

    await this.history.append({
      id: crypto.randomUUID(),
      request,
      result,
      occurredAt: new Date().toISOString(),
    });

    return result;
  }
}
