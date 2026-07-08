# Security Audit — English AI

> Review-only. Scope: authentication, RBAC/authz, secrets/config, input validation, OWASP
> touchpoints, AI safety. Cross-ref: [beta-readiness](./beta-readiness.md) §6/§12,
> [MASTER_BACKLOG](../MASTER_BACKLOG.md). No code changed.

## Scores

| Domain             | Score  | Justification                                                                 |
| ------------------ | ------ | ----------------------------------------------------------------------------- |
| Authentication     | 8/10   | Correct two-layer model; enumeration-safe; but profiles/role sync gap.        |
| Authorization/RBAC | 8/10   | Permission-based, no role-name checks; no `ai.generate`; no API authz helper. |
| Security (general) | 6.5/10 | Strong validation/IDOR/CSRF; no headers, in-memory rate limit, spoofable IP.  |
| AI Integration     | 7/10   | Keys env-only + never logged; no moderation/quota/prompt-injection guard.     |

## Done well (keep)

- **Two-layer auth is correct.** Edge middleware does authn only (`src/middleware.ts`); authz
  via `requirePermission()` in Node layouts (`src/app/(admin)/layout.tsx`). Middleware uses
  `supabase.auth.getUser()` (token revalidation), not `getSession()` (`src/lib/supabase/middleware.ts`).
- **Permission-based RBAC.** `role === 'admin'` appears only in the comment forbidding it
  (`src/lib/auth/permissions.ts`). Admin role derived from the permission catalog, not hard-coded.
- **IDOR-safe.** `user-vocabulary/[id]` mutations scope by `(id, userId)` via `findForUser`
  (service throws `NotFoundError` on miss).
- **Secrets env-only.** `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`SUPABASE_SERVICE_ROLE_KEY` are
  server-schema only; no `NEXT_PUBLIC_*` secret; no secret logged; providers inject keys from
  config (never `process.env`, never logged).
- **CSRF & open-redirect.** Server Actions are POST/Origin-checked; callback + login validate
  `next`/`redirectTo` are local paths.
- **Enumeration-safe** forgot-password/resend (generic success).
- **No SQL injection** — all access is Prisma structured `where`; no raw string SQL.
- **AI usage log stores `userId` but not prompt text** — good PII posture.

## Findings

| ID     | Severity | Location                                                                              | Issue                                                                                                                                                                    | Recommendation                                                                                | Priority |
| ------ | -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------- |
| SEC-01 | Critical | `prisma/migrations/**` (no `handle_new_user` trigger)                                 | Supabase→`profiles`/`user_roles` sync absent → verified user has empty permissions; FK inserts reject.                                                                   | `AFTER INSERT ON auth.users` trigger (SECURITY DEFINER) creating profile + default `student`. | Critical |
| SEC-02 | High     | `src/lib/security/rate-limit.ts`                                                      | In-memory `Map` store → per-instance limits multiply/reset on serverless; brute-force protection weak.                                                                   | Inject Upstash/Redis store via `setRateLimitStore()` before production.                       | Critical |
| SEC-03 | Med      | `src/lib/security/request-context.ts`                                                 | Client IP from first `x-forwarded-for` hop, untrusted → rate-limit bypass + audit poisoning.                                                                             | Derive IP from the platform's trusted real-IP header; ignore untrusted XFF.                   | High     |
| SEC-04 | Med      | `next.config.mjs`                                                                     | No CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy.                                                                                                      | Add a `headers()` block (or middleware) with the standard security headers.                   | High     |
| SEC-05 | Med      | `src/modules/ai/application/services/ai-text-service.ts`, `domain/prompt-renderer.ts` | Learner input (`WORD`/`ANSWER`/`QUESTION`) substituted into prompts undelimited; output only length-validated → prompt injection + unmoderated output reaching learners. | Delimit user variables + system "treat as data"; add an output moderation pass.               | High     |
| SEC-06 | Med      | `src/lib/auth/permissions.ts`, `(admin)/layout.tsx`                                   | No `ai.generate` permission; AI admin tools gated only by `admin.panel_access` (low blast today).                                                                        | Add `ai.generate` and gate generation actions/routes on it when live.                         | Medium   |
| SEC-07 | Low      | `src/modules/ai/application/services/ai-text-service.ts`                              | No per-user AI quota/cost cap; usage logged but not enforced.                                                                                                            | Enforce a per-user/day token/call budget using `ai_usage_logs` before dispatch.               | High     |
| SEC-08 | Low      | `src/lib/http/auth.ts`                                                                | `requireApiUser` (authn) exists but no `requireApiPermission` (authz) primitive for future routes.                                                                       | Add `requireApiPermission(code)` for parity with the page layer.                              | Low      |
| SEC-09 | Low/Info | `src/app/api/v1/vocabularies/route.ts`, `courses/route.ts`                            | Public catalog GETs apply no zod validation to `q`/`tag`/`cefrLevelId` (parameterized → low impact).                                                                     | Add lightweight zod validation; confirm public intent.                                        | Medium   |

## OWASP Top-10 quick map

- **A01 Broken Access Control:** IDOR handled ✅; RBAC permission-based ✅; SEC-01 breaks it via
  missing profile/role (Critical).
- **A02 Cryptographic Failures:** Supabase owns password hashing/tokens ✅; secrets env-only ✅.
- **A03 Injection:** SQLi none (Prisma) ✅; **prompt injection open** (SEC-05).
- **A04 Insecure Design:** graceful AI fallback ✅; rate-limit design flawed for serverless (SEC-02).
- **A05 Security Misconfiguration:** **no security headers** (SEC-04).
- **A07 Identification/Auth Failures:** enumeration-safe ✅; rate limit weak (SEC-02/03).
- **A09 Logging/Monitoring Failures:** audit logs exist ✅; **no error monitoring/alerting** (see
  Deployment) ⚠️.

## Verdict

**No secret exposure and no injection into the data layer**, and the access-control _design_ is
correct. Beta is blocked by **SEC-01 (profiles/role)** and **SEC-02/03 (rate limiting)**; add
security headers (SEC-04) and AI moderation/quota (SEC-05/07) before exposing AI generation.
