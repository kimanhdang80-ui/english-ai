# Milestone 1 — Risk Analysis

## Risk register

| ID      | Risk                                                                    | Category | Likelihood | Impact | Score | Mitigation                                                                                                           | Owner |
| ------- | ----------------------------------------------------------------------- | -------- | ---------- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------- | ----- |
| RISK-A1 | Provider request/response shape wrong (unverified vs live API)          | tech     | Med        | Med    | Med   | Adapters follow documented APIs; verify E2E when keys land (DEBT-021); typed parsing + fallback                      | Eng   |
| RISK-A2 | AI cost overrun at scale                                                | cost     | Med        | Med    | Med   | Cheap tier (Haiku/mini) + small `maxOutputTokens`; `ai_usage_logs` for monitoring; provider spend caps; quotas later | Eng   |
| RISK-A3 | Hallucinated / off-level / unsafe output shown to learners              | product  | Med        | Med    | Med   | Prompts grounded in given definition; length validation; eval harness + moderation planned (DEBT-018)                | Eng   |
| RISK-A4 | API key leakage                                                         | security | Low        | High   | Med   | Keys env-only, server-only modules, never logged; `.env` gitignored; not in `NEXT_PUBLIC_*`                          | Eng   |
| RISK-A5 | Provider latency/outage degrades UX                                     | ops      | Med        | Low    | Low   | Timeout + retry + provider fallback + **deterministic fallback** (loop never blocks)                                 | Eng   |
| RISK-A6 | `ai_usage_logs` not persisted (no DB) → no cost/usage observability yet | ops      | High       | Low    | Med   | No-op repo keeps AI running; persist on DB provisioning (DEBT-004)                                                   | Eng   |

## Top risks

1. **RISK-A1 / RISK-A6** — both resolve on provisioning (keys + DB): live verification and
   usage persistence. Until then, unit tests + graceful fallback bound the blast radius.
2. **RISK-A3** — quality/safety needs the eval harness before high-stakes or Kids use.

## Assumptions

- Provider APIs match their current public contracts (Anthropic Messages, OpenAI Chat).
- A cheap-tier model is acceptable for explanation/example/feedback quality at MVP.
