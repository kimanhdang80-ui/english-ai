# AI_PRODUCTION_READY_REPORT.md — RC-04 AI Production Ready

> Role: Principal AI Platform Engineer. Goal: bring the AI layer to production readiness —
> resilient provider chain, cost/telemetry, health check, and a metrics dashboard. **No new
> learning feature, no learning-UI change, no Learning-Engine change.** Read:
> [PROJECT_STATE.md](./docs/PROJECT_STATE.md), [PERSISTENCE_READY_REPORT.md](./PERSISTENCE_READY_REPORT.md),
> [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md). Companions: [AI_HEALTHCHECK.md](./AI_HEALTHCHECK.md),
> [AI_COST_GUIDE.md](./AI_COST_GUIDE.md). Date: 2026-07-02.

---

## 0. Summary

The AI layer already had the provider pattern (Claude/OpenAI + factory), prompts-as-data,
retry, per-call timeout, provider fallback, usage logging, and generation history. RC-04
closes the production gaps: **circuit breaker**, **cost computation**, **token streaming**,
an **AI health check**, and an **AI Metrics Dashboard**. No database migration was needed —
`ai_usage_logs` already carries `cost_micro_usd` (it was always 0; now it's populated).

## 1. AI layer audit — status after RC-04

| Concern               | Status     | Where                                                                                     |
| --------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| **Provider**          | ✅         | `ClaudeProvider` / `OpenAIProvider` (fetch, no SDK) via `ProviderFactory` (config-driven) |
| **Prompt**            | ✅         | Versioned templates in the DB (`prompt_templates`, RC-03); rendered by `PromptBuilder`    |
| **Retry**             | ✅         | `RetryingProvider` — exponential backoff, retryable-only (429/5xx/timeout/network)        |
| **Timeout**           | ✅         | Per-call `AbortController` in each adapter (`AI_TIMEOUT_MS`)                              |
| **Fallback**          | ✅         | `FallbackProvider` (primary→secondary) + capability-level deterministic fallback          |
| **Circuit Breaker**   | ✅ **new** | `CircuitBreakerProvider` — opens after N consecutive failures, half-opens after cooldown  |
| **Streaming**         | ✅ **new** | `stream()` on both adapters (SSE) + decorator delegation + connect-time fallback          |
| **Cost**              | ✅ **new** | `config/pricing.ts` + `computeCostMicroUsd` → persisted per call                          |
| **Logging**           | ✅         | `ai_usage_logs` (append-only) incl. provider/model/tokens/latency/status/**cost**         |
| **History**           | ✅         | `ai_generation_jobs` (RC-03) — generation request/result records                          |
| **Health check**      | ✅ **new** | `AiHealthService` + `GET /api/health/ai`                                                  |
| **Metrics dashboard** | ✅ **new** | `AiMetricsService` + `/admin/ai-metrics` (Requests/Success/Latency/Tokens/Cost/Fallback)  |

## 2. Resilience chain (composition)

Per base provider: `CircuitBreaker( Retrying( Adapter(timeout) ) )`. With a fallback provider
configured, both chains compose under `FallbackProvider`:

```
FallbackProvider
├─ primary:   CircuitBreaker → Retrying → ClaudeProvider(timeout)
└─ secondary: CircuitBreaker → Retrying → OpenAIProvider(timeout)
```

- **Retry policy:** `AI_MAX_RETRIES` (default 2), exponential backoff (250ms·2ⁿ), retryable
  errors only. Non-retryable (bad key, 4xx, unconfigured, circuit-open) fail fast.
- **Timeout policy:** `AI_TIMEOUT_MS` (default 20s) per attempt via `AbortController` →
  `ProviderTimeoutError` (retryable).
- **Circuit breaker:** `AI_CIRCUIT_FAILURE_THRESHOLD` (default 5) consecutive failures trip it
  **open** for `AI_CIRCUIT_COOLDOWN_MS` (default 30s); then **half-open** allows one trial;
  success **closes**, failure re-opens. Open state throws `CircuitOpenError` (non-retryable) so
  `FallbackProvider` skips straight to the secondary. State is per-process — see AI_HEALTHCHECK.md.
- **Error recovery:** any provider failure (or invalid/empty output) degrades to the
  capability's deterministic fallback in `AiTextService`, logged as `fallback`/`failed` — the
  learning loop never breaks. **If one provider errors, the chain auto-fails-over** (fallback)
  and, if both fail, the deterministic fallback answers.

## 3. Cost, streaming, observability

- **Cost:** `MODEL_PRICING` (micro-USD/token, mirrors `models.ts`) + `computeCostMicroUsd`.
  `AiTextService` computes cost per call and stores it in `ai_usage_logs.cost_micro_usd`.
  Estimated, configurable, off the critical path — details in AI_COST_GUIDE.md.
- **Streaming:** `AIProvider.stream?()` (optional). Claude (`content_block_delta`) and OpenAI
  (`choices[].delta.content`) parse SSE via a **pure** `parseSseBuffer` + `readSseData`.
  Decorators delegate: retry doesn't replay mid-stream; the circuit counts stream success/
  failure; fallback switches only on **connect-time** failure. No learning UI consumes it yet
  (kept out of scope) — the seam is production-ready and unit-tested.
- **Logging/telemetry:** unchanged sink (`ai_usage_logs`), now with cost. Best-effort (never
  throws into the call path).
- **Health:** `AiHealthService.report()` → provider/configured, circuit state, and 24h
  success/fallback/latency/cost. `GET /api/health/ai` returns 503 only when **degraded**.
- **Metrics dashboard:** `/admin/ai-metrics` (admin-gated, dynamic) — Requests · Success Rate ·
  Fallback Count · Failed · Avg Latency · Tokens · Cost + per-model & per-feature breakdowns,
  from `PrismaAiMetricsRepository` (Prisma `groupBy`). Reuses existing UI primitives (no new
  design system, no learning-UI change).

## 4. Testing

| Area             | Coverage                                                                           |
| ---------------- | ---------------------------------------------------------------------------------- |
| Provider success | `provider-factory` builds keyed adapters; streaming/complete happy paths           |
| Provider failure | `retrying-provider` (retryable vs not), `circuit-breaker` failures                 |
| Retry            | `retrying-provider.test.ts` (backoff, retryable-only, exhaustion)                  |
| Fallback         | `fallback-provider.test.ts` (complete) + streaming connect-time fallback           |
| Timeout          | `ProviderTimeoutError` retryable; surfaced via AbortController (adapter contract)  |
| Streaming        | `streaming.test.ts` — pure SSE parser (partial/CRLF/[DONE]) + decorator delegation |
| Circuit breaker  | `circuit-breaker-provider.test.ts` — open/half-open/close, short-circuit           |
| Cost             | `pricing.test.ts` — per-tier pricing, unknown model = 0, rounding                  |
| Metrics          | `metrics.test.ts` — pure `summarizeUsage` rates/averages/USD                       |
| Health           | `ai-health-service.test.ts` — ok/degraded/unconfigured, circuit-open               |

**Gates:** `typecheck` ✅ · `lint` ✅ · `test` ✅ **175** (+22) · `build` ✅ (`/api/health/ai`
dynamic) · `format` ✅. Live provider calls (real Claude/OpenAI over the network) and the
runtime metrics query need keys + a DB — verified offline here; see the deploy matrix below.

## 5. Deploy-time verification (needs API keys + DB)

| Test             | Steps                                              | Expected                                              |
| ---------------- | -------------------------------------------------- | ----------------------------------------------------- |
| Provider success | Set `ANTHROPIC_API_KEY`, trigger an explanation    | `ai_usage_logs` row `status=success`, tokens+cost > 0 |
| Provider failure | Use an invalid key                                 | `status=failed`, deterministic fallback returned      |
| Fallback         | Bad primary key + valid `AI_FALLBACK_PROVIDER` key | Secondary answers; `provider` reflects the chain      |
| Circuit          | Force ≥ threshold failures                         | Breaker opens; `/api/health/ai` circuit=`open`, 503   |
| Timeout          | Set `AI_TIMEOUT_MS=1`                              | `AI_PROVIDER_TIMEOUT`, retried then fallback          |
| Streaming        | Call `ai.llm.stream?.()` from a script             | Incremental text deltas                               |
| Metrics/Health   | Open `/admin/ai-metrics`, `GET /api/health/ai`     | Aggregates render; health reflects recent traffic     |

## 6. Scope notes

- **No learning feature / no learning-UI / no Learning-Engine change.** The metrics dashboard
  and health endpoint are **operational** surfaces (admin/ops), explicitly requested.
- **No DB migration** — cost/metrics/health use existing `ai_usage_logs` columns.
- **Circuit state is per-process** (in-memory). Multi-instance deployments get independent
  breakers — acceptable and documented (AI_HEALTHCHECK.md); a shared store is a future item.
- **Streaming has no UI consumer** (would be a learning-UI change). The provider seam is
  complete and tested; wiring a streamed explanation UI is a future product task.
- **Retained fallback:** AI usage-log sink is a no-op when no DB (Milestone-1 decision) — AI
  still runs with logging off.

## 7. Verdict

**The AI layer is production-ready.** Provider pattern with retry + timeout + circuit breaker +
provider & capability fallback; per-call cost; append-only logging + generation history; a
health probe and a metrics dashboard. All offline gates green; the only remaining steps are
operational (provide keys + DB, run §5). AI platform: 🟢 pending provisioning.
