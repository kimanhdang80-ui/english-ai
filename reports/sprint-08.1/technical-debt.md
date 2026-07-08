# Sprint 8.1 — Technical Debt (snapshot)

> Appends to the living ledger [`reports/technical-debt.md`](../technical-debt.md).

## Debt added this sprint

| ID       | Type      | Location                                                    | Description                                                                                                                         | Severity | Proposed action        |
| -------- | --------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------- |
| DEBT-016 | tech-debt | `daily-loop/infrastructure/in-memory-session-repository.ts` | Learning-session persistence is an in-memory skeleton (ephemeral). Needs a `learning_sessions` table + Prisma repo via the DB gate. | Med      | Sprint 8.2 (DB gate)   |
| DEBT-017 | product   | `daily-loop/application/services/daily-lesson-service.ts`   | Daily lesson picks corpus-order words, not personalized (skip mastered, prefer weak/new).                                           | Low      | learning-engine sprint |

## Debt paid this sprint

| ID  | How                                                 |
| --- | --------------------------------------------------- |
| —   | (none — composition sprint; nothing fixed silently) |

## Notes

- Deliberately avoided a DB change: streak/activity derived from `review_history`; review
  statuses are a presentation mapping. Session persistence deferred behind the DB gate.
