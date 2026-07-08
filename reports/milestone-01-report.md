# Milestone 1 — Real AI (Provider Integration) — Report

> Role: Senior AI Engineer. Ran the full [PROJECT_OS](../docs/PROJECT_OS.md) lifecycle.
> Goal: **replace all mock AI with real AI** (Claude + OpenAI, extensible to Gemini)
> without changing architecture, UI, the Learning Engine, or the DB beyond what's needed
> to store AI history. Governance reports: [`reports/milestone-01/`](./milestone-01/).

## 1. Scope delivered

- **AI Provider Pattern** (`src/modules/ai/infrastructure/providers/`):
  - `AIProvider` interface (structurally the existing `LlmPort` — no new architecture).
  - `ClaudeProvider` (Anthropic Messages) + `OpenAIProvider` (OpenAI Chat), both over
    `fetch` (no vendor SDK); `UnconfiguredProvider` null-object.
  - Resilience decorators: `RetryingProvider` (timeout via `AbortController` + exponential
    backoff on retryable errors only) and `FallbackProvider` (primary → secondary).
  - `ProviderFactory.create(config)` builds the chain **from configuration** (env).
- **Real capabilities** (`AiTextService`) — replace the Sprint-7.1 mocks/stubs:
  1. **Vocabulary explanation** (daily-loop `ExplanationPort` → `AiExplanationAdapter`).
  2. **Example generation** (`generateExample`).
  3. **Short-answer feedback** (`feedbackOnShortAnswer`).
     Each renders a versioned prompt template (prompts-as-data), calls `LlmPort`, validates
     output, logs usage, and **degrades to deterministic fallback** on any failure/absence.
- **Resilience:** timeout, retry, provider fallback, capability fallback, and structured
  logging — all four "on provider error" behaviors requested.
- **Config (env-only keys):** `AI_PROVIDER`, `AI_FALLBACK_PROVIDER`, `ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`, `AI_DEFAULT_MODEL`, `AI_TIMEOUT_MS`, `AI_MAX_RETRIES` — validated in
  `src/lib/env.ts`; provider switch is a one-line env change.
- **DB (gate):** ADR-0003 + `ai_usage_logs` model + migration `20260701010000_ai_usage_logs`
  - `PrismaAiUsageLogRepository` (+ `NoopAiUsageLogRepository` when no DB).
- **Docs:** `AI_INTEGRATION_GUIDE.md` (keys/config/cost/switch), ADR-0003, DECISIONS
  D-0029…D-0032, AI_ENGINE §3.3, DATABASE `ai_usage_logs`, this report + 6 governance reports.

## 2. Verification (all green)

| Gate                   | Result                                |
| ---------------------- | ------------------------------------- |
| `npm run typecheck`    | ✅ pass                               |
| `npm run lint`         | ✅ no warnings/errors                 |
| `npm run test`         | ✅ **81** passed (+19), 14 files      |
| `npm run format:check` | ✅ clean                              |
| `prisma validate`      | ✅ schema valid; `prisma generate` ✅ |
| `npm run build`        | ✅ succeeds (placeholder env)         |

## 3. Constraints honored

- **No architecture change** — providers are adapters behind the existing `LlmPort`;
  resilience is decorators of the same interface. **No framework expansion.**
- **No UI change** — capabilities are reachable via the `ai` container; the daily loop's
  explanation seam was swapped at the container only.
- **No Learning-Engine change.** **DB change limited to AI history** (`ai_usage_logs`),
  through the DB gate.
- **Keys only from env**, never hardcoded/logged; all provider code is server-only.

## 4. Known limitations (logged, not fixed — PROJECT_OS §7)

- Providers are **unverified against live APIs** (no keys/network here) — request/response
  shapes covered by unit tests with fakes only (DEBT-021).
- `ai_usage_logs` **not applied** on a live DB yet (DEBT-004); persistence uses the no-op
  repo until then. `cost_micro_usd` not yet priced (DEBT-019).
- No evaluation harness / output moderation (DEBT-018); no generation caching (DEBT-020);
  `prompt_templates`/`ai_generation_jobs` persistence still pending (DEBT-014).

## 5. Files (high level)

**Added:** `providers/{types,claude-provider,openai-provider,unconfigured-provider,
retrying-provider,fallback-provider,provider-factory,index}.ts` (+ 3 tests);
`application/services/ai-text-service.ts` (+ test); `infrastructure/{prisma,noop}-ai-usage-log-repository.ts`;
`daily-loop/infrastructure/ai-explanation-adapter.ts` (+ test);
`prisma/migrations/20260701010000_ai_usage_logs/migration.sql`; `docs/AI_INTEGRATION_GUIDE.md`;
`docs/adr/ADR-0003.md`; `reports/milestone-01*`.
**Changed:** `lib/env.ts`, `.env.example`, `ai/config/{models,prompt-templates}.ts`,
`ai/domain/entities.ts`, `ai/application/ports.ts`, `ai/infrastructure/container.ts`,
`daily-loop/infrastructure/container.ts`, `prisma/schema.prisma` (+ `AiUsageLog`, Profile
back-relation), and the docs/debt ledger.
