# AI_HEALTHCHECK.md — AI layer health & resilience

> How to check the AI layer's health, what the states mean, and how the resilience policies
> (retry / timeout / circuit breaker / fallback) behave. Companion to
> [AI_PRODUCTION_READY_REPORT.md](./AI_PRODUCTION_READY_REPORT.md) and
> [AI_COST_GUIDE.md](./AI_COST_GUIDE.md).

## Endpoints

| Endpoint             | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `GET /api/health`    | App liveness/readiness (Supabase/DB config flags).                |
| `GET /api/health/ai` | AI layer health — provider config, circuit state, recent metrics. |

### `GET /api/health/ai` response

```jsonc
{
  "status": "ok", // ok | degraded | unconfigured
  "provider": "anthropic", // or "anthropic->openai" for a fallback chain
  "configured": true, // a real (non-placeholder) API key is set
  "circuit": "closed", // closed | open | half_open | composite | n/a
  "databaseAvailable": true, // metrics window requires a DB
  "window": {
    // null when unconfigured or no DB
    "hours": 24,
    "requests": 128,
    "successRate": 0.98,
    "fallbackRate": 0.02,
    "avgLatencyMs": 740,
    "costUsd": 0.0123,
  },
  "checkedAt": "2026-07-02T00:00:00.000Z",
}
```

**HTTP status:** `200` for `ok`/`unconfigured`; **`503`** only for `degraded` (so a load
balancer/uptime check reacts to a real problem, not to AI being intentionally off).

### Status meaning

| status         | Meaning                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `ok`           | Provider configured; circuit closed/half-open; recent success rate healthy. |
| `degraded`     | Circuit **open**, or recent success rate `< 50%` with traffic. Investigate. |
| `unconfigured` | No API key — AI runs on deterministic fallbacks. Not an error.              |

## Resilience policies (env-tunable)

| Policy              | Env var                                | Default          | Behavior                                                |
| ------------------- | -------------------------------------- | ---------------- | ------------------------------------------------------- |
| Timeout             | `AI_TIMEOUT_MS`                        | 20000            | Per attempt; abort → `AI_PROVIDER_TIMEOUT` (retryable). |
| Retry               | `AI_MAX_RETRIES`                       | 2                | Exponential backoff (250ms·2ⁿ); retryable errors only.  |
| Circuit threshold   | `AI_CIRCUIT_FAILURE_THRESHOLD`         | 5                | Consecutive failures that trip the breaker **open**.    |
| Circuit cooldown    | `AI_CIRCUIT_COOLDOWN_MS`               | 30000            | Time open before a **half-open** trial call.            |
| Provider / fallback | `AI_PROVIDER` / `AI_FALLBACK_PROVIDER` | anthropic / none | Primary and optional secondary vendor.                  |

### Circuit breaker state machine

```
closed ──(≥ threshold consecutive failures)──▶ open
open ──(cooldown elapsed)──▶ half_open
half_open ──(trial success)──▶ closed
half_open ──(trial failure)──▶ open
any success in closed ──▶ resets the failure counter
```

- The breaker wraps the retry decorator (`Breaker(Retrying(base))`): **all retries exhaust
  first**, then the whole call counts as one breaker failure.
- When **open**, `complete()`/`stream()` throw `CircuitOpenError` (non-retryable) immediately,
  so the `FallbackProvider` fails over to the secondary without waiting on a dead provider.

> **Scope:** circuit state is **per process/instance** (in-memory). In a multi-instance
> deployment each instance keeps its own breaker — acceptable for graceful degradation; a
> shared (e.g. Redis) breaker is a future enhancement.

## Error recovery ladder

1. **Retry** transient errors (timeout/429/5xx/network) with backoff.
2. **Circuit breaker** stops hammering a persistently-failing provider.
3. **Provider fallback** (if configured) routes to the secondary vendor.
4. **Capability fallback** — `AiTextService` returns deterministic text and logs
   `fallback`/`failed`. The learner always gets a usable answer.

## Operating notes

- **No keys?** `configured=false`, `status=unconfigured` — expected in CI/local; AI is off.
- **No DB?** health reports config/circuit only (`window=null`); metrics dashboard shows a
  "requires a database" notice.
- **Spike in `fallbackRate`/`degraded`:** check provider status, key validity, rate limits, and
  `AI_TIMEOUT_MS`; the circuit will self-heal after the cooldown once the provider recovers.
