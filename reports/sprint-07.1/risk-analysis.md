# Sprint 7.1 — Risk Analysis

## Risk register

| ID      | Risk                                                                        | Category | Likelihood | Impact | Score    | Mitigation                                                                                          | Owner       |
| ------- | --------------------------------------------------------------------------- | -------- | ---------- | ------ | -------- | --------------------------------------------------------------------------------------------------- | ----------- |
| RISK-01 | Prompt-injection via learner/authoring inputs once a real provider is wired | security | Med        | High   | Med·High | Treat inputs as untrusted; validate/escape; system-prompt hardening; provider-side guardrails (7.2) | Eng         |
| RISK-02 | Token estimate (chars/4) diverges from real tokenizer → wrong budgets/costs | tech     | Med        | Low    | Med      | Swap in a real tokenizer behind the same signature when the adapter lands                           | Eng         |
| RISK-03 | AI cost/latency once generation is live                                     | ops/cost | Med        | Med    | Med      | Model tiering (Haiku→Sonnet→Opus), prompt caching, per-plan quotas, usage logging (7.2)             | Eng/Product |
| RISK-04 | In-memory history lost on restart / not shared across instances             | tech     | High       | Low    | Med      | Persist via Prisma (DEBT-014); it is a placeholder only                                             | Eng         |
| RISK-05 | Generated content quality/safety (hallucination, wrong level)               | product  | Med        | Med    | Med      | Output schema validation + human-review gate before publish (7.2)                                   | Product     |

## Top risks

1. **RISK-01 (prompt injection)** — becomes real the moment a provider is connected;
   must be addressed in 7.2 before any user-supplied variable reaches a live model.

## Assumptions & unknowns

- An `ANTHROPIC_API_KEY` and DB will be available for 7.2.
- Default model `claude-sonnet-4-6` per the model registry.

## Contingencies

- If the provider is unavailable, the stub keeps the app functional (preview works;
  generation returns a graceful 501).
