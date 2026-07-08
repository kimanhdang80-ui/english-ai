import type {
  ValidationIssue,
  ValidationReport,
} from '@/modules/ai/domain/entities';

import { estimateTokens } from './token-estimator';

/**
 * Content validation rules (pure). Used for both prompt and generated output.
 * Checks required by the sprint: empty, too long, wrong format.
 */

export type OutputFormat = 'text' | 'json';

export interface ValidatorOptions {
  maxTokens?: number;
  format?: OutputFormat;
  requiredKeys?: string[];
}

function report(issues: ValidationIssue[]): ValidationReport {
  return { valid: issues.every((i) => i.severity !== 'error'), issues };
}

export class ContentValidator {
  /** Validate a rendered prompt before sending it to a provider. */
  validatePrompt(prompt: string): ValidationReport {
    if (prompt.trim() === '') {
      return report([
        {
          code: 'EMPTY_PROMPT',
          message: 'Prompt is empty.',
          severity: 'error',
        },
      ]);
    }
    return report([]);
  }

  /** Validate a generated output (length + optional format/shape). */
  validateOutput(
    output: string,
    opts: ValidatorOptions = {},
  ): ValidationReport {
    const issues: ValidationIssue[] = [];

    if (output.trim() === '') {
      issues.push({
        code: 'EMPTY_OUTPUT',
        message: 'Output is empty.',
        severity: 'error',
      });
      return report(issues);
    }

    if (
      opts.maxTokens !== undefined &&
      estimateTokens(output) > opts.maxTokens
    ) {
      issues.push({
        code: 'OUTPUT_TOO_LONG',
        message: `Output exceeds the ${opts.maxTokens}-token budget.`,
        severity: 'error',
      });
    }

    if (opts.format === 'json') {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(output);
      } catch {
        issues.push({
          code: 'INVALID_FORMAT',
          message: 'Output is not valid JSON.',
          severity: 'error',
        });
      }
      if (parsed && typeof parsed === 'object' && opts.requiredKeys) {
        const obj = parsed as Record<string, unknown>;
        for (const key of opts.requiredKeys) {
          if (!(key in obj)) {
            issues.push({
              code: 'MISSING_KEY',
              message: `Output is missing required key "${key}".`,
              severity: 'error',
            });
          }
        }
      }
    }

    return report(issues);
  }
}
