import {
  NotFoundError,
  NotImplementedError,
  ValidationError,
} from '@/lib/errors';
import type { PromptVersion } from '@/modules/ai/domain/entities';

import type { PromptTemplateRepository } from '@/modules/ai/application/ports';

/**
 * Prompt version management. Reads are implemented over the repository; write paths
 * (draft/publish/archive) are SKELETONS this sprint — they throw NotImplementedError
 * until persistence + an authoring flow land (see NEXT_TASK).
 */
export class PromptVersionService {
  constructor(private readonly templates: PromptTemplateRepository) {}

  async listVersions(templateKey: string): Promise<PromptVersion[]> {
    const template = await this.templates.findByKey(templateKey);
    if (!template) throw new NotFoundError('PromptTemplate', templateKey);
    return this.templates.listVersions(template.id);
  }

  async getActiveVersion(templateKey: string): Promise<PromptVersion> {
    const template = await this.templates.findByKey(templateKey);
    if (!template) throw new NotFoundError('PromptTemplate', templateKey);
    const active = await this.templates.getActiveVersion(template.id);
    if (!active) {
      throw new ValidationError(
        `No active version for template "${templateKey}".`,
      );
    }
    return active;
  }

  // --- write skeletons (Sprint 7.x) ---
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createDraft(_templateKey: string, _body: string): Promise<never> {
    throw new NotImplementedError('PromptVersionService.createDraft');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async publish(_templateKey: string, _version: number): Promise<never> {
    throw new NotImplementedError('PromptVersionService.publish');
  }
}
