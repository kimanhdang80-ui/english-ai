# REFACTOR_PLAN.md

> Scheduled remediation for items in the technical-debt ledger
> ([`reports/technical-debt.md`](../reports/technical-debt.md)). This is a **plan** —
> nothing here is executed until it lands in a sprint's scope ([PROJECT_OS.md](./PROJECT_OS.md) §7).
> Refactors are behavior-preserving and kept **separate** from feature commits (CLAUDE.md §8).

## Scheduled

| Debt               | Refactor                                                                                                                                | Sprint     | Notes / preconditions                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| DEBT-001, DEBT-012 | Add **Vitest**; unit tests (SRS, quiz, RBAC, pagination) + service tests (mocked ports); repo integration test + Postgres service in CI | 4.2        | Tests are net-new (not a rewrite); wire `npm test` into CI |
| DEBT-004           | Provision Postgres; `prisma migrate dev` (commit migration); run seed                                                                   | 4.2        | Requires a real DB/Supabase project                        |
| DEBT-005           | Extract shared `toReviewCard` mapper in the vocabulary repo                                                                             | 4.2        | Behavior-preserving; covered by new repo tests             |
| DEBT-006           | Extract pagination value objects to a shared kernel (`src/lib/pagination`); update learning + vocabulary imports                        | 4.2 or 6.x | Pure move; update imports only                             |
| DEBT-008           | Supabase→`profiles` sync trigger/webhook + default `student` role on sign-up                                                            | 2.2        | Auth completeness                                          |
| DEBT-009           | Learning-engine authoring writes + draft→publish version flow; implement progress persistence                                           | 3.2        | Removes the 501 placeholder                                |

## Backlog (not yet scheduled)

| Debt     | Refactor                                                           | Trigger                                     |
| -------- | ------------------------------------------------------------------ | ------------------------------------------- |
| DEBT-002 | Migrate `next lint` → ESLint CLI + flat config                     | Before upgrading to Next 16                 |
| DEBT-003 | Migrate Prisma seed config → `prisma.config.ts`                    | Before upgrading to Prisma 7                |
| DEBT-007 | Tighten middleware matcher / cache session revalidation            | Measured latency or cost pressure           |
| DEBT-010 | Swap in Redis/Upstash rate-limit store via `setRateLimitStore`     | Before production scale (Redis provisioned) |
| DEBT-011 | Consider a thin REST facade for auth or document the split clearly | If external/non-web consumers appear        |

## Principles

- Refactor only with test coverage in place first (add characterization tests if needed).
- One concern per PR; refactors separate from behavior changes.
- Update this plan and the debt ledger when items move OPEN → SCHEDULED → RESOLVED.
