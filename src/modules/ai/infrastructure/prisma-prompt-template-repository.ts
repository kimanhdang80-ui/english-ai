import type { PrismaClient } from '@prisma/client';

import type {
  PromptCategory,
  PromptTemplate,
  PromptVariable,
  PromptVersion,
  PromptVersionStatus,
} from '@/modules/ai/domain/entities';
import type { PromptTemplateRepository } from '@/modules/ai/application/ports';

type TemplateRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  variables: unknown;
  activeVersion: number | null;
};

type VersionRow = {
  id: string;
  templateId: string;
  version: number;
  body: string;
  model: string;
  maxOutputTokens: number;
  status: string;
  notes: string | null;
  createdAt: Date;
};

/**
 * Serves prompt templates/versions from the DATABASE (`prompt_templates` /
 * `prompt_versions`, ADR-0005). Replaces the in-memory registry repo (DEBT-014):
 * templates are seeded from `config/prompt-templates.ts` and read from the DB, so
 * authoring can evolve without a redeploy. Read-only here (authoring is a later feature).
 */
export class PrismaPromptTemplateRepository implements PromptTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listTemplates(): Promise<PromptTemplate[]> {
    const rows = await this.prisma.promptTemplate.findMany({
      orderBy: { key: 'asc' },
    });
    return rows.map(toTemplate);
  }

  async findByKey(key: string): Promise<PromptTemplate | null> {
    const row = await this.prisma.promptTemplate.findUnique({ where: { key } });
    return row ? toTemplate(row) : null;
  }

  async listVersions(templateId: string): Promise<PromptVersion[]> {
    const rows = await this.prisma.promptVersion.findMany({
      where: { templateId },
      orderBy: { version: 'asc' },
    });
    return rows.map(toVersion);
  }

  async getActiveVersion(templateId: string): Promise<PromptVersion | null> {
    const row = await this.prisma.promptVersion.findFirst({
      where: { templateId, status: 'active' },
      orderBy: { version: 'desc' },
    });
    return row ? toVersion(row) : null;
  }

  async findVersion(
    templateId: string,
    version: number,
  ): Promise<PromptVersion | null> {
    const row = await this.prisma.promptVersion.findUnique({
      where: { templateId_version: { templateId, version } },
    });
    return row ? toVersion(row) : null;
  }
}

function toTemplate(row: TemplateRow): PromptTemplate {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    category: row.category as PromptCategory,
    variables: (row.variables as PromptVariable[]) ?? [],
    activeVersion: row.activeVersion,
  };
}

function toVersion(row: VersionRow): PromptVersion {
  return {
    id: row.id,
    templateId: row.templateId,
    version: row.version,
    body: row.body,
    model: row.model,
    maxOutputTokens: row.maxOutputTokens,
    status: row.status as PromptVersionStatus,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
