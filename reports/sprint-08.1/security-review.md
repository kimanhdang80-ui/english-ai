# Sprint 8.1 — Security Review

> Findings only — remediation scheduled via the debt ledger (PROJECT_OS §7).

## 1. Authentication & authorization

- Dashboard, `/learn/today`, `/review`, `/progress` are under `(dashboard)` →
  `requireUser` (Node) + Edge middleware on the `/learn`, `/review`, `/progress`,
  `/dashboard` prefixes. ✅
- All daily-loop reads are scoped by `user.id` from the session; the review queue and
  streak only ever reflect the current user's data. ✅

## 2. Input validation

- The lesson player's only mutation is **add word** → `POST /api/v1/user-vocabulary`,
  which validates `vocabularyId` (uuid) and requires auth (from Sprint 4.1). No new inputs.
- Quiz is client-graded practice; no answer keys are sent from the server (D-0020).

## 3. Data exposure

- No secrets, no PII beyond the user's own study data. The mock explanation contains only
  public word definitions. In-memory session store holds transient, per-user data only.

## 4. OWASP touchpoints

- **Access control:** session-scoped queries (above). **Injection:** Prisma parameterizes.
- **CSRF:** the add-word call is a same-site JSON POST behind auth.
- No new endpoints, secrets, or external calls introduced.

## 5. Findings

| ID     | Area | Issue                                                                              | Severity | Proposed action                                                         |
| ------ | ---- | ---------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------- |
| SEC-01 | data | Session data is in-memory (not per-user isolated across a shared instance restart) | Low      | Persist per-user via DB (DEBT-016) — already user-keyed in the skeleton |

## 6. Verdict

**No new security exposure ✅** — session-scoped, no new inputs/secrets/endpoints.
