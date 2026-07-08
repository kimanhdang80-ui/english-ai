# AI_COST_GUIDE.md — AI cost model & controls

> How AI cost is estimated, where the numbers live, and the levers to control spend. Companion
> to [AI_PRODUCTION_READY_REPORT.md](./AI_PRODUCTION_READY_REPORT.md) and
> [AI_HEALTHCHECK.md](./AI_HEALTHCHECK.md).

## How cost is computed

Every provider call records tokens (`tokens_in` / `tokens_out`) and an **estimated cost** in
`ai_usage_logs.cost_micro_usd`:

```
cost_micro_usd = round(tokens_in × inputRate + tokens_out × outputRate)
```

Rates are **micro-USD per token** (1 micro-USD = 1e-6 USD), i.e. the published "$ per 1M tokens"
number used directly (e.g. $3 / 1M tokens = 3 micro-USD/token). Cost is computed by
`computeCostMicroUsd()` in [`src/modules/ai/config/pricing.ts`](./src/modules/ai/config/pricing.ts)
and written by `AiTextService`. It is an **estimate for budgeting/observability** — never on the
learner's critical path, and never a hard billing figure.

## Price table (authoring-time list prices — verify before relying on them)

| Model (id)                  | Input ($/1M) | Output ($/1M) | Tier            |
| --------------------------- | ------------ | ------------- | --------------- |
| `claude-opus-4-8`           | 15           | 75            | hardest/most $  |
| `claude-sonnet-4-6`         | 3            | 15            | default         |
| `claude-haiku-4-5-20251001` | 0.80         | 4             | cheap/fast      |
| `gpt-4o`                    | 2.50         | 10            | OpenAI flagship |
| `gpt-4o-mini`               | 0.15         | 0.60          | OpenAI cheap    |

> These are **configuration, not truth**. When a provider changes pricing, update
> `MODEL_PRICING` only — nothing else references prices. An **unknown model → cost 0** and
> `hasPricing(model) === false`, so a missing row degrades gracefully (it never breaks logging)
> but under-reports cost until you add it.

## Where cost shows up

- **Per call:** `ai_usage_logs.cost_micro_usd`.
- **Dashboard:** `/admin/ai-metrics` — total cost (USD) for the window + per-model cost.
- **Health:** `GET /api/health/ai` → `window.costUsd` (last 24h).

## Cost controls (levers)

1. **Model tiering** — the default capability model is set per prompt version
   (`prompt_versions.model`). Explanations/examples/feedback use **Haiku** (cheapest); reserve
   Sonnet/Opus for genuinely hard generation. Changing a version's model is a data change.
2. **Provider selection** — `AI_PROVIDER` / `AI_FALLBACK_PROVIDER` (e.g. Claude primary, OpenAI
   mini fallback). One env change, no code edit.
3. **Output budget** — `prompt_versions.max_output_tokens` caps output tokens (the larger cost
   driver). Keep capability prompts tight (they already are: 120–500 tokens).
4. **Fewer calls** — deterministic fallbacks answer when AI is off; the SRS/planner are
   deterministic (no AI). Only user-facing text capabilities call a provider.
5. **Timeouts/retries** — `AI_TIMEOUT_MS` / `AI_MAX_RETRIES` bound wasted spend on slow/failing
   calls; the circuit breaker stops paying for a dead provider.

## Estimating spend

Rough monthly estimate for a capability:

```
monthly_usd ≈ calls/day × 30
            × (avg_in_tokens × inputRate + avg_out_tokens × outputRate) / 1e6
```

Example — 1,000 explanations/day on Haiku, ~250 in / ~120 out tokens:

```
per call ≈ 250×0.8 + 120×4 = 200 + 480 = 680 micro-USD ≈ $0.00068
monthly  ≈ 1000 × 30 × 0.00068 ≈ $20.4 / month
```

Switching that capability to Sonnet (3 / 15) would be ~4–5× more — hence Haiku-first.

## Future

- Per-user / per-feature **budgets & quotas** (enforce, not just observe).
- **Prompt caching** for repeated system prompts (provider-supported) to cut input cost.
- Persisted **daily cost rollups** for long-range trend charts (dashboard currently queries a
  rolling window live).
