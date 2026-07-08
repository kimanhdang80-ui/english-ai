/**
 * AI module — application ports. Services depend on these; infrastructure implements
 * them. The `LlmPort` is the provider-agnostic seam (AI_ENGINE.md): a real Claude/OpenAI
 * adapter drops in here later without touching the domain or services.
 */
import type {
  AiUsageLogEntry,
  GenerationRecord,
  LlmCompletion,
  LlmRequest,
  PromptTemplate,
  PromptVersion,
} from '@/modules/ai/domain/entities';
import type { AiUsageAggregate } from '@/modules/ai/domain/metrics';

export interface LlmPort {
  readonly providerName: string;
  readonly configured: boolean;
  complete(input: LlmRequest): Promise<LlmCompletion>;
}

/**
 * Append-only sink for provider-call telemetry (`ai_usage_logs`). Implemented by a
 * Prisma repo when a DB is configured, and a no-op otherwise so AI still runs without
 * persistence. Logging must never throw into the call path.
 */
export interface AiUsageLogRepository {
  append(entry: AiUsageLogEntry): Promise<void>;
}

export interface PromptTemplateRepository {
  listTemplates(): Promise<PromptTemplate[]>;
  findByKey(key: string): Promise<PromptTemplate | null>;
  listVersions(templateId: string): Promise<PromptVersion[]>;
  getActiveVersion(templateId: string): Promise<PromptVersion | null>;
  findVersion(
    templateId: string,
    version: number,
  ): Promise<PromptVersion | null>;
}

export interface GenerationHistoryRepository {
  append(record: GenerationRecord): Promise<void>;
  list(limit: number): Promise<GenerationRecord[]>;
}

/**
 * Read side of `ai_usage_logs` — rolls up telemetry over a time window for the metrics
 * dashboard and health check. Separate from the append-only `AiUsageLogRepository`.
 */
export interface AiMetricsRepository {
  aggregate(sinceHours: number): Promise<AiUsageAggregate>;
}
