# Milestone 1 — Technical Debt (snapshot)

> Appends to the living ledger [`reports/technical-debt.md`](../technical-debt.md).

## Debt added this milestone

| ID       | Type        | Location               | Description                                                                                  | Severity | Proposed action   |
| -------- | ----------- | ---------------------- | -------------------------------------------------------------------------------------------- | -------- | ----------------- |
| DEBT-018 | tech-debt   | `src/modules/ai/**`    | No AI evaluation harness / output moderation beyond length checks.                           | Med      | AI quality sprint |
| DEBT-019 | tech-debt   | `ai-text-service.ts`   | `ai_usage_logs.cost_micro_usd` always 0 — tokens logged but not priced.                      | Low      | AI cost dashboard |
| DEBT-020 | performance | `src/modules/ai/**`    | No generation caching — identical (capability, inputs) re-hit the provider.                  | Low      | AI cost dashboard |
| DEBT-021 | tech-debt   | providers (live calls) | Providers unverified against live APIs (no keys/network here) — only fake-backed unit tests. | Med      | AI provisioning   |

## Debt changed this milestone

| ID       | Change                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| DEBT-014 | OPEN → **PARTIAL** — real `LlmPort` provider chain + `ai_usage_logs` shipped; template/job persistence still pending. |
| DEBT-004 | Note extended — new `20260701010000_ai_usage_logs` migration is also authored-but-unapplied (no live DB).             |

## Debt paid this milestone

| ID  | How                                                                   |
| --- | --------------------------------------------------------------------- |
| —   | (partial only — DEBT-014 advanced; nothing fully closed without a DB) |

## Notes

- Deliberately **did not** add vendor SDK deps (used `fetch`) or a `LoggingProvider`
  decorator (logging needs capability context) — both recorded as decisions (D-0030/D-0032),
  not debt.
