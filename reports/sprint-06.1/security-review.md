# Sprint 6.1 — Security Review

> Findings only — remediation scheduled via the debt ledger (PROJECT_OS §7).

## 1. Authentication & authorization

- Learner endpoints (`POST/PATCH /user-vocabulary*`, `/reviews/today`,
  `/user-vocabulary/stats`) require auth (`requireApiUser` → 401). ✅
- **Ownership** enforced: `findForUser(id, userId)` / `updateMany where {id,userId}` →
  a foreign id yields 404, never another user's row. The service test asserts the
  not-found path (V-12/V-18). ✅

## 2. Input validation

- Zod validates `POST` (`vocabularyId` uuid) and `PATCH` (`rating` enum / `isFavorite`
  boolean; at least one required). Pagination coerced/clamped. ✅

## 3. Data exposure

- Catalog/detail responses expose no learner data; **no answer keys** are returned for
  practice content (quiz graded client-side, D-0020). ✅
- Seed data is non-sensitive public content. Tests use no real credentials/PII. ✅

## 4. OWASP touchpoints

- **Access control:** ownership scoping (above). **Injection:** Prisma parameterizes.
- **CSRF:** mutations are Server Actions (auth) / JSON API with same-site cookies.
- **Rate limiting:** auth actions limited; catalog reads unthrottled — see DEBT-010 (store)
  and note for a future public catalog API (SR-03).
- **Secrets:** none added; tests use no secrets.

## 5. Findings

| ID     | Area       | Issue                                                                                            | Severity | Proposed action  |
| ------ | ---------- | ------------------------------------------------------------------------------------------------ | -------- | ---------------- |
| SEC-01 | rate-limit | In-memory limiter not shared across instances (pre-existing)                                     | Med      | **DEBT-010**     |
| SEC-02 | public API | Catalog reads unauthenticated by spec (SR-03) — fine today; needs throttling if exposed publicly | Low      | Track with SR-03 |

## 6. Verdict

**No new issues ✅** — ownership + validation intact; two pre-existing items already tracked.
