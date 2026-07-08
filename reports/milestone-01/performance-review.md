# Milestone 1 — Performance Review

## Hot paths & budgets

- **Daily lesson build** (`DailyLessonService.buildQuiz`) issues up to ~5 explanation calls.
  With real AI these are **network** calls (previously in-memory). They run concurrently
  (`Promise.all`) but each is now latency-bound by the provider.
  - **Budget:** cheap-tier, `maxOutputTokens ≤ 200`, `AI_TIMEOUT_MS = 20 000`. Worst case is
    bounded by the timeout; typical Haiku/mini latency is sub-second to a few seconds.
  - **Mitigation available now:** deterministic fallback returns instantly on timeout, so a
    slow provider degrades gracefully rather than hanging the page.
- **Retries** multiply latency on transient failures (≤ `AI_MAX_RETRIES` with exp. backoff).
  Non-retryable errors fail fast (no wasted waits).

## Findings (not fixed — logged)

| ID     | Finding                                                                                 | Severity | Action                                                                                        |
| ------ | --------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| PERF-1 | No caching of identical (capability, inputs) generations → repeat provider cost/latency | Low      | Add content-hash cache (DEBT-020)                                                             |
| PERF-2 | ~5 explanation calls per lesson build add network latency to `/learn/today` SSR         | Med      | Cache + precompute; or lazy-load per card; consider moving explanations client-side on demand |
| PERF-3 | `ai_usage_logs` is an extra write per AI call (append-only, fire-and-forget)            | Low      | Fine at MVP; monthly partition + archival at scale (DATABASE.md)                              |

## Payload hygiene

- Prompts send only word/definition/level (data-minimized). Outputs capped by
  `maxOutputTokens`. No large payloads introduced.

## Verdict

Acceptable for MVP with graceful degradation. The main watch item is **PERF-2** (SSR
latency of the daily lesson once real AI is on) — mitigated by fallback today, and by
caching/lazy-loading later (logged, not fixed this milestone).
