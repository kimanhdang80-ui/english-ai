import { z } from 'zod';

/**
 * Environment validation (CLAUDE.md §3, §9).
 *
 * Non-throwing by design: `next build` and local dev must succeed even before a
 * real Supabase/DB is wired. Validation issues are surfaced via `getEnvIssues()`
 * and enforced at the point of use via `assertAuthConfigured()` — so a
 * misconfigured deployment fails loudly on the auth path, not silently.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('English AI'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // --- AI providers (server-only; never exposed to the client) ---
  AI_PROVIDER: z.enum(['anthropic', 'openai']).default('anthropic'),
  AI_FALLBACK_PROVIDER: z.enum(['anthropic', 'openai', 'none']).default('none'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  // Optional model overrides; otherwise the config defaults (models.ts) apply.
  AI_DEFAULT_MODEL: z.string().min(1).optional(),
  // Resilience knobs (see docs/AI_INTEGRATION_GUIDE.md).
  AI_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(120_000)
    .default(20_000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  // Circuit breaker: open after N consecutive failures, retry after a cooldown.
  AI_CIRCUIT_FAILURE_THRESHOLD: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(5),
  AI_CIRCUIT_COOLDOWN_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(600_000)
    .default(30_000),
});

// NEXT_PUBLIC_* must be referenced statically so Next can inline them.
const rawClient = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const clientParsed = clientSchema.safeParse(rawClient);
const serverParsed = serverSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,
  AI_TIMEOUT_MS: process.env.AI_TIMEOUT_MS,
  AI_MAX_RETRIES: process.env.AI_MAX_RETRIES,
  AI_CIRCUIT_FAILURE_THRESHOLD: process.env.AI_CIRCUIT_FAILURE_THRESHOLD,
  AI_CIRCUIT_COOLDOWN_MS: process.env.AI_CIRCUIT_COOLDOWN_MS,
});

// A parsed-with-defaults view of the server env (safe even when parsing failed:
// falls back to schema defaults so the app boots without AI configured).
const serverData = serverParsed.success
  ? serverParsed.data
  : serverSchema.parse({});

const clientData = clientParsed.success
  ? clientParsed.data
  : clientSchema.parse({}); // defaults only

export const clientEnv = {
  appUrl: clientData.NEXT_PUBLIC_APP_URL,
  appName: clientData.NEXT_PUBLIC_APP_NAME,
  supabaseUrl: clientData.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: clientData.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;

export const serverEnv = {
  databaseUrl: serverData.DATABASE_URL ?? '',
  supabaseServiceRoleKey: serverData.SUPABASE_SERVICE_ROLE_KEY ?? '',
} as const;

/**
 * AI provider configuration (server-only). Keys come exclusively from the
 * environment — never hardcoded (CLAUDE.md §9). Consumed by `ProviderFactory`.
 */
export const aiEnv = {
  provider: serverData.AI_PROVIDER,
  fallbackProvider: serverData.AI_FALLBACK_PROVIDER,
  anthropicApiKey: serverData.ANTHROPIC_API_KEY ?? '',
  openaiApiKey: serverData.OPENAI_API_KEY ?? '',
  defaultModel: serverData.AI_DEFAULT_MODEL ?? '',
  timeoutMs: serverData.AI_TIMEOUT_MS,
  maxRetries: serverData.AI_MAX_RETRIES,
  circuitFailureThreshold: serverData.AI_CIRCUIT_FAILURE_THRESHOLD,
  circuitCooldownMs: serverData.AI_CIRCUIT_COOLDOWN_MS,
} as const;

/** A placeholder value (from .env.example / CI) is treated as "not configured". */
export function isRealValue(value: string): boolean {
  return value.length > 0 && !value.toLowerCase().includes('placeholder');
}

/** True when Supabase Auth is genuinely wired (not placeholder). */
export const isSupabaseConfigured =
  isRealValue(clientEnv.supabaseUrl) && isRealValue(clientEnv.supabaseAnonKey);

/** True when a real database connection string is present. */
export const isDatabaseConfigured = isRealValue(serverEnv.databaseUrl);

/** True when the selected AI provider has a real (non-placeholder) API key. */
export const isAiConfigured =
  aiEnv.provider === 'anthropic'
    ? isRealValue(aiEnv.anthropicApiKey)
    : isRealValue(aiEnv.openaiApiKey);

/** True when the configured fallback provider (if any) also has a real key. */
export const isAiFallbackConfigured =
  aiEnv.fallbackProvider === 'anthropic'
    ? isRealValue(aiEnv.anthropicApiKey)
    : aiEnv.fallbackProvider === 'openai'
      ? isRealValue(aiEnv.openaiApiKey)
      : false;

/** Collected validation problems for diagnostics/health endpoints. */
export function getEnvIssues(): string[] {
  const issues: string[] = [];
  if (!clientParsed.success) {
    issues.push(
      ...clientParsed.error.issues.map(
        (i) => `client: ${i.path.join('.')} ${i.message}`,
      ),
    );
  }
  if (!serverParsed.success) {
    issues.push(
      ...serverParsed.error.issues.map(
        (i) => `server: ${i.path.join('.')} ${i.message}`,
      ),
    );
  }
  if (!isSupabaseConfigured)
    issues.push(
      'Supabase Auth is not configured (placeholder or missing keys).',
    );
  if (!isDatabaseConfigured) issues.push('DATABASE_URL is not configured.');
  return issues;
}

/**
 * Guard for the auth path. Throws a friendly, non-leaky error when Supabase is not
 * configured so server actions can degrade gracefully instead of crashing.
 */
export function assertAuthConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new AuthNotConfiguredError();
  }
}

export class AuthNotConfiguredError extends Error {
  constructor() {
    super('Authentication service is not configured.');
    this.name = 'AuthNotConfiguredError';
  }
}
