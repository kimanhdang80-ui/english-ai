# Sprint 7.1 — Technical Debt (snapshot)

> Appends to the living ledger [`reports/technical-debt.md`](../technical-debt.md).

## Debt added this sprint

| ID       | Type           | Location                             | Description                                                                                                                                                                            | Severity | Proposed action            |
| -------- | -------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------- |
| DEBT-014 | tech-debt      | `src/modules/ai/**`                  | AI generator is foundation-only: stub provider (501) + in-memory repos. Needs a real `LlmPort` adapter + Prisma persistence (`prompt_templates`/`generation_history`) via the DB gate. | Med      | Sprint 7.2 (DB gate first) |
| DEBT-015 | security/authz | `src/app/(admin)/admin/*` (AI tools) | AI tools gated by `admin.panel_access` only; add a dedicated `ai.generate` permission.                                                                                                 | Low      | Sprint 7.2                 |

## Debt paid this sprint

| ID  | How it was resolved        |
| --- | -------------------------- |
| —   | (none — foundation sprint) |

## Notes

- No existing debt was in scope; nothing fixed silently.
- Deliberately did **not** add Prisma tables (would trigger the DB gate) — kept the sprint
  a pure framework build.
