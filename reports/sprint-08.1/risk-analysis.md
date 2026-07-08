# Sprint 8.1 — Risk Analysis

## Risk register

| ID      | Risk                                                                                        | Category | Likelihood | Impact | Score    | Mitigation                                                                             | Owner   |
| ------- | ------------------------------------------------------------------------------------------- | -------- | ---------- | ------ | -------- | -------------------------------------------------------------------------------------- | ------- |
| RISK-01 | Loop unverified end-to-end (no DB in the environment)                                       | tech     | High       | Med    | High·Med | Provision DB + manual E2E + integration tests (8.2)                                    | Eng     |
| RISK-02 | Session summary shown but not persisted → learners lose history on restart                  | product  | High       | Low    | Med      | `learning_sessions` table via DB gate (DEBT-016)                                       | Eng     |
| RISK-03 | Streak/timezone: activity days computed in UTC may misalign with a learner's local day      | product  | Med        | Low    | Med      | Use learner timezone when profiles/tz land; pure function makes this a one-line change | Eng     |
| RISK-04 | Daily lesson not personalized → may re-show mastered words                                  | product  | Med        | Low    | Med      | Add selection logic (DEBT-017)                                                         | Product |
| RISK-05 | New users have no `profiles`/role row (sync not wired) → dashboard queries return empty/err | tech     | Med        | Med    | Med      | Sprint 2.2 profiles sync (DEBT-008)                                                    | Eng     |

## Top risks

1. **RISK-01 / RISK-05** — the loop can't be exercised until a DB exists and profiles are
   synced; both are scheduled (8.2 / 2.2). Code is otherwise complete and green.

## Assumptions & unknowns

- A Postgres/Supabase instance and a signed-in profile will exist for 8.2.

## Contingencies

- If profiles sync slips, seed a profile row manually for beta testers to exercise the loop.
