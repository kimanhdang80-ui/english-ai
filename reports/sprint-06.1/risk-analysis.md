# Sprint 6.1 — Risk Analysis

## Risk register

| ID      | Risk                                                                                                         | Category | Likelihood | Impact | Score   | Mitigation                                                                                                                            | Owner       |
| ------- | ------------------------------------------------------------------------------------------------------------ | -------- | ---------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| RISK-01 | Baseline migration diverges from what `prisma migrate dev` would generate, causing drift when first applied  | tech     | Low        | Med    | Low·Med | Migration is `prisma migrate diff --from-empty` output (the canonical init); verify with `migrate status`/`diff` on first apply (6.2) | Eng         |
| RISK-02 | Repositories unverified against a real DB (only service-level unit tests) — a query/`include` bug could ship | tech     | Med        | Med    | Med     | Integration tests + Postgres in CI in 6.2 (DEBT-012)                                                                                  | Eng         |
| RISK-03 | Seed data quality (IPA/translations) not linguistically reviewed                                             | product  | Med        | Low    | Med     | A1 words are common; flag for a content/native-speaker review pass                                                                    | Content     |
| RISK-04 | SRS parameters (7d/30d thresholds, ease steps) may not be pedagogically optimal                              | product  | Med        | Low    | Med     | Parameters isolated in `srs.ts` + unit-tested; tune from real review data later                                                       | Eng/Product |
| RISK-05 | `pageSize=0` spec ambiguity (DEBT-013) causes inconsistent client expectations                               | tech     | Low        | Low    | Low     | Clarify V-02 deliberately in 6.2                                                                                                      | Architect   |

## Top risks

1. **RISK-02** — data layer untested against Postgres. Trigger to act: before any prod
   use; mitigated fully in Sprint 6.2 integration tests.

## Assumptions & unknowns

- A Postgres/Supabase instance will be available in Sprint 6.2.
- Learner locale defaults to `vi` for translations (per PRODUCT.md).

## Contingencies

- If the migration mis-applies, regenerate from `schema.prisma` with `migrate dev` on a
  scratch DB and replace the baseline before first production apply.
