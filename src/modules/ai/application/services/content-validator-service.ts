import type { ValidationReport } from '@/modules/ai/domain/entities';
import {
  ContentValidator,
  type ValidatorOptions,
} from '@/modules/ai/domain/content-validator';

/** Thin application wrapper over the pure ContentValidator. */
export class ContentValidatorService {
  constructor(private readonly validator: ContentValidator) {}

  validatePrompt(prompt: string): ValidationReport {
    return this.validator.validatePrompt(prompt);
  }

  validateOutput(
    output: string,
    opts: ValidatorOptions = {},
  ): ValidationReport {
    return this.validator.validateOutput(output, opts);
  }
}
