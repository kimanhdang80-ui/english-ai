import 'server-only';

import { aiEnv, isDatabaseConfigured, isRealValue } from '@/lib/env';
import { prisma } from '@/lib/prisma';

import { ContentValidator } from '@/modules/ai/domain/content-validator';
import { DifficultyAdjuster } from '@/modules/ai/domain/difficulty-adjuster';
import { PromptRenderer } from '@/modules/ai/domain/prompt-renderer';

import {
  AiHealthService,
  type AiCircuit,
} from '@/modules/ai/application/services/ai-health-service';
import { AiMetricsService } from '@/modules/ai/application/services/ai-metrics-service';
import { AiTextService } from '@/modules/ai/application/services/ai-text-service';
import { ContentValidatorService } from '@/modules/ai/application/services/content-validator-service';
import { DifficultyService } from '@/modules/ai/application/services/difficulty-service';
import { LessonGeneratorService } from '@/modules/ai/application/services/lesson-generator-service';
import { PromptBuilder } from '@/modules/ai/application/services/prompt-builder';
import { PromptVersionService } from '@/modules/ai/application/services/prompt-version-service';
import { TokenEstimator } from '@/modules/ai/application/services/token-estimator';

import { NoopAiUsageLogRepository } from './noop-ai-usage-log-repository';
import { PrismaAiMetricsRepository } from './prisma-ai-metrics-repository';
import { PrismaAiUsageLogRepository } from './prisma-ai-usage-log-repository';
import { PrismaGenerationHistoryRepository } from './prisma-generation-history-repository';
import { PrismaPromptTemplateRepository } from './prisma-prompt-template-repository';
import {
  CircuitBreakerProvider,
  FallbackProvider,
  ProviderFactory,
  type AIProvider,
} from './providers';

/**
 * Composition root for the AI module. The LLM seam is now a **real provider chain**
 * built from configuration (`ProviderFactory` → Claude/OpenAI + retry/timeout/fallback).
 * When no API key is configured the chain reports `configured=false`, so the capability
 * services degrade to deterministic fallbacks — the app still runs with AI switched off.
 */
const renderer = new PromptRenderer();
const contentValidator = new ContentValidator();
const difficultyAdjuster = new DifficultyAdjuster();

// RC-03: templates + generation history are now served from the DB (ADR-0005),
// seeded from PROMPT_TEMPLATE_REGISTRY by `prisma:seed`. No in-memory stores remain.
const templateRepo = new PrismaPromptTemplateRepository(prisma);
const historyRepo = new PrismaGenerationHistoryRepository(prisma);

// Keys come only from the environment; placeholders are treated as "not set".
const llm = ProviderFactory.create({
  provider: aiEnv.provider,
  fallbackProvider: aiEnv.fallbackProvider,
  anthropicApiKey: isRealValue(aiEnv.anthropicApiKey)
    ? aiEnv.anthropicApiKey
    : '',
  openaiApiKey: isRealValue(aiEnv.openaiApiKey) ? aiEnv.openaiApiKey : '',
  timeoutMs: aiEnv.timeoutMs,
  maxRetries: aiEnv.maxRetries,
  circuitFailureThreshold: aiEnv.circuitFailureThreshold,
  circuitCooldownMs: aiEnv.circuitCooldownMs,
});

// Persist telemetry only when a DB exists; otherwise AI still runs (no-op sink).
const usageLog = isDatabaseConfigured
  ? new PrismaAiUsageLogRepository(prisma)
  : new NoopAiUsageLogRepository();

const builder = new PromptBuilder(renderer);
const validatorService = new ContentValidatorService(contentValidator);
const difficultyService = new DifficultyService(difficultyAdjuster);
const tokenEstimator = new TokenEstimator();

const generator = new LessonGeneratorService(
  templateRepo,
  historyRepo,
  llm,
  builder,
  validatorService,
  difficultyService,
  tokenEstimator,
);

const text = new AiTextService(
  templateRepo,
  llm,
  builder,
  validatorService,
  usageLog,
);

// Observability: metrics read side + health probe. Metrics need a DB; without one the
// health probe still reports provider/circuit status (no window).
const metricsRepo = isDatabaseConfigured
  ? new PrismaAiMetricsRepository(prisma)
  : null;
const metrics = metricsRepo ? new AiMetricsService(metricsRepo) : null;

/** Inspect the composed provider chain for its circuit-breaker state. */
function circuitStateOf(provider: AIProvider): AiCircuit {
  if (provider instanceof CircuitBreakerProvider) return provider.state;
  if (provider instanceof FallbackProvider) return 'composite';
  return 'n/a';
}

const health = new AiHealthService(llm, metricsRepo, () => circuitStateOf(llm));

export const ai = {
  generator,
  text,
  templates: templateRepo,
  history: historyRepo,
  versions: new PromptVersionService(templateRepo),
  promptBuilder: builder,
  validator: validatorService,
  difficulty: difficultyService,
  tokenEstimator,
  usageLog,
  metrics,
  health,
  llm,
};

export type AiContainer = typeof ai;
