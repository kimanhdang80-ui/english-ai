import type {
  PromptTemplate,
  PromptVersion,
} from '@/modules/ai/domain/entities';
import { PromptRenderer } from '@/modules/ai/domain/prompt-renderer';

export interface BuiltPrompt {
  rendered: string;
  /** Required variables (per the template) with no value provided. */
  missingRequired: string[];
  /** Tokens in the body left unresolved after rendering. */
  unresolved: string[];
}

/**
 * Assembles a concrete prompt from a template version + supplied variables and reports
 * what is missing. Pure orchestration over the renderer — no provider call.
 */
export class PromptBuilder {
  constructor(private readonly renderer: PromptRenderer) {}

  build(
    template: PromptTemplate,
    version: PromptVersion,
    variables: Record<string, string>,
  ): BuiltPrompt {
    const missingRequired = template.variables
      .filter((v) => v.required && !(variables[v.name] ?? '').trim())
      .map((v) => v.name);

    const { rendered, missing } = this.renderer.render(version.body, variables);
    return { rendered, missingRequired, unresolved: missing };
  }
}
