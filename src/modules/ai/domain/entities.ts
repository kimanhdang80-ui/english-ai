/**
 * AI Lesson Generator — domain read models (framework-free, no provider SDKs).
 * Sprint 7.1 builds the FOUNDATION only: no OpenAI/Claude calls are made.
 * Prompts are DATA (templates + versions), never inline in services (CLAUDE.md).
 */

export type PromptCategory =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'conversation'
  | 'generic';

export type PromptVersionStatus = 'draft' | 'active' | 'archived';

export type GenerationStatus =
  | 'previewed' // prompt rendered + validated; no provider called
  | 'completed'
  | 'failed'
  | 'provider_unavailable';

export type ValidationSeverity = 'error' | 'warning';
export type VariableType = 'string' | 'number' | 'enum';

/** A declared placeholder in a template body (e.g. `WORD`, `LEVEL`). */
export interface PromptVariable {
  name: string;
  description: string;
  required: boolean;
  type: VariableType;
  example?: string;
  allowed?: string[]; // for `enum`
}

export interface PromptTemplate {
  id: string;
  key: string; // unique slug
  name: string;
  description: string;
  category: PromptCategory;
  variables: PromptVariable[];
  activeVersion: number | null;
}

export interface PromptVersion {
  id: string;
  templateId: string;
  version: number;
  body: string; // contains `{{VARIABLE}}` tokens
  model: string; // default model id (config) — NOT called this sprint
  maxOutputTokens: number;
  status: PromptVersionStatus;
  notes?: string;
  createdAt: string;
}

export interface GenerationRequest {
  templateKey: string;
  variables: Record<string, string>;
  level?: string; // CEFR override; otherwise read from variables.LEVEL
  requestedBy?: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface DifficultyProfile {
  level: string;
  maxOutputTokens: number;
  maxSentenceWords: number;
  guidance: string;
}

export interface GenerationResult {
  templateKey: string;
  status: GenerationStatus;
  model: string;
  renderedPrompt: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number; // budget from the version
  difficulty: DifficultyProfile;
  promptValidation: ValidationReport;
  output?: string;
  outputValidation?: ValidationReport;
}

export interface GenerationRecord {
  id: string;
  request: GenerationRequest;
  result: GenerationResult;
  occurredAt: string;
}

/** Provider-agnostic completion contract (implemented by adapters; stub in 7.1). */
export interface LlmRequest {
  prompt: string;
  model: string;
  maxOutputTokens: number;
}

export interface LlmCompletion {
  text: string;
  tokensIn: number;
  tokensOut: number;
}

/** Learner-facing AI capabilities (used to tag usage logs by `feature`). */
export type AiCapability =
  | 'vocabulary_explanation'
  | 'example_generation'
  | 'short_answer_feedback'
  | 'lesson_generation';

export type AiCallStatus = 'success' | 'failed' | 'fallback';

/**
 * One row of the append-only `ai_usage_logs` table (DATABASE.md). Captures cost,
 * latency, and outcome of every provider call for observability and budgeting.
 * Framework-free; the infrastructure repo maps this to Prisma.
 */
export interface AiUsageLogEntry {
  feature: AiCapability;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  /** Estimated cost in micro-USD (1e-6 USD); 0 when the model has no pricing row. */
  costMicroUsd: number;
  latencyMs: number;
  status: AiCallStatus;
  cacheHit: boolean;
  userId?: string | null;
  errorCode?: string | null;
  occurredAt: string; // ISO-8601
}
