# AI_INTEGRATION_GUIDE.md — English AI

> How to configure, run, switch, and reason about the real AI providers wired in
> **Milestone 1 (Real AI)**. Design rationale: [ADR-0003](./adr/ADR-0003.md);
> capabilities & model strategy: [AI_ENGINE.md](./AI_ENGINE.md). Coding/security rules:
> [CLAUDE.md](./CLAUDE.md) §3, §9.

---

## 1. What is wired

Three learner-facing capabilities now call a **real** AI provider (Anthropic Claude or
OpenAI), replacing the Sprint-7.1 mocks/stubs — behind the same ports, so nothing above
the infrastructure layer changed:

| Capability                 | Where it plugs in                                       | Model tier (default)  |
| -------------------------- | ------------------------------------------------------- | --------------------- |
| **Vocabulary explanation** | `daily-loop` `ExplanationPort` → `AiExplanationAdapter` | Haiku (cheap/fast)    |
| **Example generation**     | `ai.text.generateExample()`                             | Haiku                 |
| **Short-answer feedback**  | `ai.text.feedbackOnShortAnswer()`                       | Haiku                 |
| _Lesson generation_        | `ai.generator` (`LlmPort`) — provider now real          | Sonnet (per template) |

Every call is **resilient by default** (timeout → retry → provider fallback →
deterministic fallback) and **logged** to `ai_usage_logs`. If no API key is set, the app
runs unchanged on the deterministic fallback — AI is strictly additive.

## 2. How to get an API key

### Anthropic (Claude) — default

1. Create an account at **https://console.anthropic.com**.
2. Go to **Settings → API Keys → Create Key**. Copy the `sk-ant-…` value.
3. Add billing (pay-as-you-go). Set a monthly spend limit under **Billing → Limits**.

### OpenAI — alternative

1. Create an account at **https://platform.openai.com**.
2. **Dashboard → API keys → Create new secret key**. Copy the `sk-…` value.
3. Add billing and a monthly budget under **Settings → Limits**.

> Keys are secrets. Never commit them, never put them in `NEXT_PUBLIC_*`, never log them.
> Store them in your host's secret manager (Vercel/Railway env vars), not in the repo.

## 3. How to configure

Set these **server-only** variables (see [`.env.example`](../.env.example)). Copy to
`.env` / `.env.local` locally, or set them in your host's dashboard in production.

| Variable               | Default     | Meaning                                                           |
| ---------------------- | ----------- | ----------------------------------------------------------------- |
| `AI_PROVIDER`          | `anthropic` | Primary provider: `anthropic` \| `openai`.                        |
| `AI_FALLBACK_PROVIDER` | `none`      | Auto-fallback provider on failure: `anthropic`\|`openai`\|`none`. |
| `ANTHROPIC_API_KEY`    | _(empty)_   | Claude key (`sk-ant-…`). Required if using Anthropic.             |
| `OPENAI_API_KEY`       | _(empty)_   | OpenAI key (`sk-…`). Required if using OpenAI.                    |
| `AI_DEFAULT_MODEL`     | _(config)_  | Optional model override; otherwise `config/models.ts` wins.       |
| `AI_TIMEOUT_MS`        | `20000`     | Per-call timeout (aborts the request).                            |
| `AI_MAX_RETRIES`       | `2`         | Retries on transient errors (429/5xx/timeout), exp. backoff.      |

**Minimal Claude setup:**

```dotenv
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-xxxxxxxx"
```

**Cross-provider resilience (Claude primary, OpenAI fallback):**

```dotenv
AI_PROVIDER="anthropic"
AI_FALLBACK_PROVIDER="openai"
ANTHROPIC_API_KEY="sk-ant-xxxxxxxx"
OPENAI_API_KEY="sk-xxxxxxxx"
```

Verify configuration at runtime via `isAiConfigured` (`src/lib/env.ts`) or the env
diagnostics (`getEnvIssues()`). No key ⇒ the loop uses the deterministic fallback.

## 4. How to switch providers

Switching is a **configuration change — never a code edit** (CLAUDE.md §3):

1. Set `AI_PROVIDER="openai"` (and ensure `OPENAI_API_KEY` is set).
2. Redeploy / restart. `ProviderFactory.create()` reads the env and builds the chain.

To add **Gemini** later: add one `GeminiProvider implements AIProvider` adapter and a
`case 'google'` in `ProviderFactory`; extend the `AI_PROVIDER` enum. Nothing else changes.

To change which **model** a capability uses: edit the prompt template's `model` in
`src/modules/ai/config/prompt-templates.ts`, or the tier map in `config/models.ts` — both
are the single source of truth for model ids.

## 5. Cost estimate (rough, order-of-magnitude)

Costs depend on provider list prices (check the provider's pricing page — they change).
Our capabilities are deliberately **cheap-tier (Haiku / gpt-4o-mini)** with small prompts
(~200–400 input tokens) and short outputs (≤ 200 tokens).

| Capability             | Approx tokens (in/out) | Order-of-magnitude cost/call |
| ---------------------- | ---------------------- | ---------------------------- |
| Vocabulary explanation | ~250 / ~120            | fractions of a cent          |
| Example generation     | ~120 / ~60             | fractions of a cent          |
| Short-answer feedback  | ~250 / ~120            | fractions of a cent          |

**Per learner/day:** a daily lesson triggers ~5 explanations (+ optional examples/feedback)
→ on the order of **a fraction of a cent per learner per day** at the cheap tier. Sonnet/Opus
(lesson generation) are ~10–30× costlier per token — reserved for on-demand generation.

**Levers to control cost** (see AI_ENGINE.md §5): model tiering (Haiku first), short
prompts/outputs (already enforced by `maxOutputTokens`), caching identical generations
(future), and the `ai_usage_logs` table for a cost dashboard + per-user quotas. Always
set a hard monthly spend cap at the provider.

## 6. Reliability behavior (what happens on failure)

Applied in order, so a learner never sees a hard error from AI:

1. **Timeout** — each call aborts after `AI_TIMEOUT_MS`.
2. **Retry** — transient errors (HTTP 429/5xx, network, timeout) retry up to
   `AI_MAX_RETRIES` with exponential backoff; non-retryable errors (bad key, 4xx) fail fast.
3. **Provider fallback** — if `AI_FALLBACK_PROVIDER` is set, the secondary provider is tried.
4. **Deterministic fallback** — if all providers fail (or none is configured), the
   capability returns a safe rule-based result and records a `fallback`/`failed`
   `ai_usage_logs` row. The daily loop keeps working.

## 7. Observability & privacy

- Every call writes one `ai_usage_logs` row: `feature, provider, model, tokens_in/out,
latency_ms, status, error_code, occurred_at` (+ nullable `user_id`). **No prompt text or
  secrets are stored.** (Persisted only when a database is configured; otherwise a no-op.)
- Prompts send only the minimum needed (word, definition, level) — data minimization
  (AI_ENGINE.md §7). Do not add PII to prompts.

## 8. Security checklist (CLAUDE.md §9)

- [x] Keys read only from env; never hardcoded, never in `NEXT_PUBLIC_*`, never logged.
- [x] All provider code is server-only (`src/modules/ai/**`, imported via `server-only`).
- [x] Timeouts + retries bound blast radius; logging failures are swallowed.
- [ ] Add per-user AI quotas + a dedicated `ai.generate` permission before exposing
      generation in the UI (DEBT-015).
- [ ] Add output moderation + an evaluation harness before high-stakes use (AI_ENGINE §6).
