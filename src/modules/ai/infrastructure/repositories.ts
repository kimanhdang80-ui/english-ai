import type {
  GenerationRecord,
  PromptTemplate,
  PromptVersion,
} from '@/modules/ai/domain/entities';
import type {
  GenerationHistoryRepository,
  PromptTemplateRepository,
} from '@/modules/ai/application/ports';
import type { PromptTemplateSeed } from '@/modules/ai/config/prompt-templates';

/**
 * In-memory AI repositories — **TEST-ONLY fakes** (RC-03). The runtime now serves prompt
 * templates and generation history from the DB (`PrismaPromptTemplateRepository` /
 * `PrismaGenerationHistoryRepository`, `prompt_templates` / `prompt_versions` /
 * `ai_generation_jobs`, ADR-0005). These doubles are retained only for fast unit tests of
 * the AI services; they are not wired into any container.
 */
export class InMemoryPromptTemplateRepository implements PromptTemplateRepository {
  private readonly templates: PromptTemplate[];
  private readonly versionsByTemplate: Map<string, PromptVersion[]>;

  constructor(registry: PromptTemplateSeed[]) {
    this.templates = registry.map((r) => r.template);
    this.versionsByTemplate = new Map(
      registry.map((r) => [r.template.id, r.versions]),
    );
  }

  async listTemplates(): Promise<PromptTemplate[]> {
    return [...this.templates];
  }

  async findByKey(key: string): Promise<PromptTemplate | null> {
    return this.templates.find((t) => t.key === key) ?? null;
  }

  async listVersions(templateId: string): Promise<PromptVersion[]> {
    return [...(this.versionsByTemplate.get(templateId) ?? [])];
  }

  async getActiveVersion(templateId: string): Promise<PromptVersion | null> {
    const versions = this.versionsByTemplate.get(templateId) ?? [];
    return versions.find((v) => v.status === 'active') ?? null;
  }

  async findVersion(
    templateId: string,
    version: number,
  ): Promise<PromptVersion | null> {
    const versions = this.versionsByTemplate.get(templateId) ?? [];
    return versions.find((v) => v.version === version) ?? null;
  }
}

export class InMemoryGenerationHistoryRepository implements GenerationHistoryRepository {
  private readonly records: GenerationRecord[] = [];

  async append(record: GenerationRecord): Promise<void> {
    this.records.unshift(record);
  }

  async list(limit: number): Promise<GenerationRecord[]> {
    return this.records.slice(0, limit);
  }
}
