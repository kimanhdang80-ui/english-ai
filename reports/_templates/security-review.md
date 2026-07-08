# Sprint <XX.Y> — Security Review

> Copy to `reports/sprint-<XX.Y>/security-review.md`. Findings only — remediation is
> scheduled via technical-debt/refactor-plan. Rules per [CLAUDE.md](../../docs/CLAUDE.md) §9.

## 1. Authentication & authorization

- Protected endpoints require auth? Ownership/RBAC enforced? <notes>

## 2. Input validation

- All external inputs validated (DTO/zod) at the boundary? <notes>

## 3. Data exposure

- Any sensitive data / answer keys / PII leaked in responses or logs? <notes>

## 4. OWASP touchpoints

- Injection, broken access control, CSRF, secrets, rate limiting, security headers. <notes>

## 5. Findings

| ID      | Area | Issue | Severity     | Proposed action                                         |
| ------- | ---- | ----- | ------------ | ------------------------------------------------------- |
| SEC-### |      |       | low/med/high | log → refactor-plan / (fix only if in-scope & required) |

## 6. Verdict

- No issues ✅ / Findings logged ⚠️ / Blocking issue ❌ — summary.
