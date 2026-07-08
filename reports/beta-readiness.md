# Beta Readiness Review — English AI

> **Role:** Principal Software Architect + QA Lead. **Mode:** review only — no code changed,
> no refactor, no migration, no package added. **Date:** 2026-07-01.
> Evidence gathered by reading the full codebase (165 TS/TSX files, ~10k LOC, 41 tables,
> 16 route handlers, 25 pages, 14 test files) and five parallel deep audits. Companion
> reports: [architecture-score](./architecture-score.md), [security-audit](./security-audit.md),
> [performance-audit](./performance-audit.md), [bug-list](./bug-list.md),
> [technical-debt-full](./technical-debt-full.md), [refactor-roadmap](./refactor-roadmap.md),
> and the consolidated [MASTER_BACKLOG](../MASTER_BACKLOG.md).

---

## Verdict

**NOT ready for a public beta. Ready for a closed internal alpha** once the four Critical
blockers are cleared. The engineering _foundation is genuinely strong_ — clean hexagonal
architecture, honest debt tracking, a spec-faithful vocabulary MVP, a real AI provider
chain. What blocks beta is **operational readiness (no live DB, no profile/role sync),
one architectural performance mistake (AI in the SSR render path), and production
hardening (rate-limit store, security headers, a11y, loading/error states)** — not missing
features.

**Overall weighted score: 6.8 / 10** ("solid pre-beta foundation, not yet production-hardened").

| Go/No-Go gate                                 | Status                                |
| --------------------------------------------- | ------------------------------------- |
| Core learner loop implemented (code-complete) | ✅ Yes                                |
| Runs against a real database                  | ❌ No — never provisioned/applied     |
| A new signup gets a usable account            | ❌ No — profiles/role sync missing    |
| Core page latency acceptable                  | ❌ No — `/learn/today` can hang on AI |
| Brute-force / abuse protection holds in prod  | ⚠️ Weak — in-memory rate limiter      |
| Baseline accessibility (WCAG 2.2 AA)          | ⚠️ Partial                            |
| Error/loading UX on data pages                | ❌ No boundaries/skeletons            |

---

## Scorecard (18 areas)

| #   | Area             | Score  | One-line                                                                   |
| --- | ---------------- | ------ | -------------------------------------------------------------------------- |
| 1   | Architecture     | 9/10   | Framework-free domain+application project-wide; clean ports/adapters       |
| 2   | Folder Structure | 9/10   | 4 modules share an identical layered shape; tests co-located               |
| 3   | Database         | 8/10   | Well-normalized, correct onDelete + composite indexes; search index gap    |
| 4   | Prisma           | 7/10   | Good singleton/select/tx discipline; over-fetch + one non-atomic read      |
| 5   | API              | 8/10   | Consistent envelope + error mapping across 15 handlers; minor 400/500 gaps |
| 6   | Authentication   | 8/10   | Correct two-layer authn/authz; **profiles/role sync missing**              |
| 7   | Learning Engine  | 6/10   | Real read repos but **zero seed data** + Progress is 501                   |
| 8   | Vocabulary       | 7.5/10 | Flagship works end-to-end + tested; 2 repo-level edge bugs                 |
| 9   | AI Integration   | 8/10   | Real provider chain + graceful fallback; unverified vs live APIs           |
| 10  | UI               | 7/10   | Clean design system + empty states; no mobile nav, some placeholders       |
| 11  | Performance      | 3/10   | **AI calls inside `/learn/today` SSR** → up to ~100s tail; no caching      |
| 12  | Security         | 6.5/10 | Strong authz/secrets; **in-memory rate limit**, no headers, spoofable IP   |
| 13  | Accessibility    | 5/10   | Good labels/focus; no aria-live, color-only quiz feedback, no field assoc  |
| 14  | Technical Debt   | 7/10   | Exceptionally tracked (DEBT-001…021); some live skeletons + dead code      |
| 15  | Code Duplication | 6/10   | Provider `complete()`/`safeErrorDetail` duplicated across two adapters     |
| 16  | Naming           | 9/10   | Consistent conventions; no dumping-ground utils                            |
| 17  | Scalability      | 3/10   | In-memory rate-limit/session/AI-history stores; no Redis/CDN/queue         |
| 18  | Deployment       | 6/10   | Solid CI + standalone Docker + health probe; no CD/migrate/monitoring      |

**Weighted average ≈ 6.8/10.** Strengths cluster in _design-time_ quality (architecture,
naming, structure); weaknesses cluster in _run-time_ readiness (performance, scalability,
security hardening, a11y) — the classic pre-beta profile.

---

## Per-area detail (Score · Description · Risk · Recommendation · Priority)

### 1. Architecture — 9/10

- **Description:** True hexagonal layering; `domain/` + `application/` in all 4 modules import
  no framework/ORM/vendor SDK (verified by grep). Composition isolated to per-module
  `container.ts`. AI provider layer is decorator-composed (retry→fallback) behind a
  structural `LlmPort`.
- **Risk:** Low. One cross-module _domain_ import (pagination) leaks the boundary (DEBT-006).
- **Recommendation:** Promote pagination to `src/lib`; otherwise preserve as-is.
- **Priority:** Low.

### 2. Folder Structure — 9/10

- **Description:** Consistent `domain/application/infrastructure` per module; tests co-located;
  `src/lib` and `src/components` well-organized; single-purpose files.
- **Risk:** Low. The documented `presentation/` folder doesn't exist (route handlers live in
  `src/app`) — a doc/impl naming gap only.
- **Recommendation:** Note the convention in SYSTEM_ARCHITECTURE; no move needed.
- **Priority:** Low.

### 3. Database — 8/10

- **Description:** 41 tables, well-normalized; deliberate `onDelete` (Cascade for owned data,
  SetNull for audit/logs); composite indexes match real query paths; soft-delete + append-only
  used correctly; content versioning modeled cleanly.
- **Risk:** Medium. No trigram/full-text index behind the `word ILIKE '%q%'` search → full
  scans as the catalog grows. Documented monthly partitioning is not yet DDL. **Migrations
  are authored but never applied on a live DB.**
- **Recommendation:** Add a `pg_trgm` GIN index (new migration) for search; provision Postgres
  and `prisma migrate deploy`.
- **Priority:** Critical (provisioning) / Medium (search index).

### 4. Prisma — 7/10

- **Description:** Textbook client singleton; lists paginate + filter `deletedAt`; SRS write is
  a real `$transaction` with review-history append.
- **Risk:** Medium. Review/quiz paths over-fetch the full word graph (meanings/examples/audio/
  images/tags) when a card needs a slim projection; `setFavorite` does a non-atomic
  updateMany→findUniqueOrThrow (bug — see [bug-list](./bug-list.md) BUG-001).
- **Recommendation:** Add slim `select` for card contexts; make favorite update atomic.
- **Priority:** High (BUG-001) / Medium (over-fetch).

### 5. API — 8/10

- **Description:** All 15 v1 handlers share `ok`/`okPage`/`fail`/`handleError`; `STATUS_BY_CODE`
  maps domain errors to HTTP correctly; every response carries `requestId`; 501 (progress) is
  intentional and documented.
- **Risk:** Medium. Enum/query params on catalog + learning endpoints are unvalidated → invalid
  input raises a raw Prisma error mapped to **500 instead of 400** (BUG-004); `q` is not trimmed
  (BUG-003); catalog GETs are public and unvalidated.
- **Recommendation:** Add zod validation at the route boundary for query enums/strings.
- **Priority:** High.

### 6. Authentication — 8/10

- **Description:** Correct two-layer model — Edge middleware does authn only via
  `supabase.auth.getUser()` (revalidates, not `getSession`), Node layouts enforce authz via
  `requirePermission`. Enumeration-safe reset/resend; PKCE + open-redirect-guarded callback.
- **Risk:** **Critical.** No Supabase→`profiles`/`user_roles` sync (DEBT-008): a verified user
  has no profile row and an empty permission set, so `requirePermission` universally fails and
  FK inserts (`user_vocabulary`, `audit_logs`) reject. The app is effectively unusable for real
  signups until this exists.
- **Recommendation:** Add an `AFTER INSERT ON auth.users` trigger (SECURITY DEFINER) creating
  the profile + default `student` role, or do it transactionally in `/auth/callback`.
- **Priority:** Critical.

### 7. Learning Engine — 6/10

- **Description:** Generic content domain (Course→Unit→Lesson→Activity→Exercise→Question) with 7
  real Prisma read repos, correct mappers/NotFound/pagination.
- **Risk:** Medium. **No seed data** — every learning-engine endpoint returns empty/404 on a
  fresh DB. `ProgressService.recordProgress` is 501 (DEBT-009). Authoring/publish absent.
- **Recommendation:** Out of scope for a _vocabulary_ beta; keep read-only + document as
  "not in beta." Do not expose these routes in beta UI.
- **Priority:** Medium (post-beta), but **flag clearly** so it isn't mistaken for ready.

### 8. Vocabulary — 7.5/10

- **Description:** The flagship. Catalog list/detail, add-to-learning, SRS review, favorite,
  stats, reviews/today all functional and spec-faithful; SM-2-lite scheduler and quiz generator
  are correct (verified line-by-line) and unit-tested; 100 A1 words seeded.
- **Risk:** Medium. `setFavorite` repo unsafe (BUG-001); `addToLearning` TOCTOU returns 500 on
  concurrent double-submit instead of idempotent 201 (BUG-002, spec violation).
- **Recommendation:** Fix the two repo edge cases; add integration tests against Postgres.
- **Priority:** High.

### 9. AI Integration — 8/10

- **Description:** Real `ProviderFactory` → Claude/OpenAI (fetch, no SDK) + retry + fallback;
  `AiTextService` capabilities (explain/example/feedback) with capability-level deterministic
  fallback; usage logged to `ai_usage_logs` (no-op sink without a DB). The suspected daily-loop
  id-parsing regex was verified **correct** (not a bug).
- **Risk:** High (operational). Unverified against live provider APIs (no keys/network here);
  **called synchronously in SSR** (see Performance); no output moderation, no prompt-injection
  guard, no per-user quota, `cost_micro_usd` always 0.
- **Recommendation:** Move generation out of the render path (Performance); verify E2E with keys;
  add moderation + quota before exposing generation.
- **Priority:** Critical (render-path) / High (moderation, quota).

### 10. UI — 7/10

- **Description:** Clean tokenized shadcn/ui system, dark mode (next-themes, hydration-safe),
  responsive core flows, good empty states, optimistic UI reconciled on failure. Core learner
  journey (dashboard→lesson→quiz→review→progress) is genuinely built.
- **Risk:** Medium. **No mobile navigation** (nav is `hidden … sm:flex`, disappears < 640px);
  profile/settings/admin/learn-explorer are placeholders; a few sub-44px touch targets.
- **Recommendation:** Add a mobile bottom-nav; clearly gate placeholder routes out of beta.
- **Priority:** High (mobile nav) / Medium (placeholders).

### 11. Performance — 3/10

- **Description:** Most paths are fine, but `/learn/today` SSR awaits ~5 real AI explanation
  calls during render (`DailyLessonService.buildQuiz`); with 20s timeout × 2 retries × optional
  provider fallback the tail can reach ~100s and blocks the page from streaming. No caching of
  deterministic generations (`cache_hit` column exists, always false). Middleware adds a
  Supabase round-trip per request. Dashboard fans out ~7 count queries uncached. No `next/image`.
- **Risk:** Critical. With AI enabled, the primary learning page can hang/timeout.
- **Recommendation:** Render the deterministic fallback immediately and hydrate AI text via a
  separate client request (or precompute/cache); cap this feature's timeout and disable
  provider fallback for it; add a generation cache; collapse dashboard counts.
- **Priority:** Critical.

### 12. Security — 6.5/10

- **Description:** Env-only secrets (never logged, no `NEXT_PUBLIC_*` secret), permission-based
  RBAC (no role-name checks), IDOR-safe ownership scoping, Prisma parameterization, Server-Action
  CSRF, enumeration-safe auth.
- **Risk:** High. **In-memory rate limiter** → auth brute-force protection multiplies/bypasses on
  serverless; **spoofable `x-forwarded-for`** for rate-limit/audit keys; **no security headers**
  (CSP/HSTS/X-Frame/etc.); no AI output moderation; no `ai.generate` permission.
- **Recommendation:** Wire a Redis rate-limit store; trust only the platform's real-IP; add a
  `headers()`/middleware security-header block; add moderation + `ai.generate` before AI UI.
- **Priority:** Critical (rate limit + IP) / High (headers).

### 13. Accessibility — 5/10

- **Description:** Good baseline: `<Label htmlFor>` + autocomplete on all auth fields,
  `focus-visible` rings, `aria-busy` submit, `aria-pressed` favorite, `role="progressbar"`, alt
  fallbacks.
- **Risk:** High for AA compliance. No `aria-live`/`role="status"` on quiz/flashcard results;
  correct/incorrect signaled by **color only**; form errors not linked (`aria-invalid`/
  `aria-describedby` absent); unlabeled quiz inputs; no `prefers-reduced-motion`.
- **Recommendation:** Add live regions + text/icon labels for results; associate field errors;
  label quiz inputs.
- **Priority:** High.

### 14. Technical Debt — 7/10

- **Description:** Debt is honestly and thoroughly tracked (DEBT-001…021 living ledger with
  severity/status/target; resolved items verified). See [technical-debt-full](./technical-debt-full.md).
- **Risk:** Medium. Several skeletons ship in production containers (in-memory session/AI-history/
  template repos, 501 services); one dead file (`StubLlmAdapter`, now only in a test).
- **Recommendation:** Keep the ledger; schedule DEBT-004/008/016 for beta; delete dead code.
- **Priority:** Medium.

### 15. Code Duplication — 6/10

- **Description:** Vocabulary mapping dup already resolved (DEBT-005). Remaining: `safeErrorDetail`
  is byte-identical in both providers and the whole `complete()` fetch/timeout/abort scaffold is
  near-identical.
- **Risk:** Low. Divergence risk as providers evolve.
- **Recommendation:** Extract an `HttpLlmProvider` base / `fetchWithTimeout` helper.
- **Priority:** Low.

### 16. Naming — 9/10

- **Description:** CLAUDE.md conventions consistently applied (kebab files, PascalCase types,
  camelCase, UPPER_SNAKE constants, is/has booleans); no misleading names; no catch-all utils.
- **Risk:** Low.
- **Recommendation:** None material.
- **Priority:** Low.

### 17. Scalability — 3/10

- **Description:** Rate-limit store, daily-loop session repo, and AI template/history repos are
  all in-memory (per-instance) and wired into production containers; no Redis/CDN; AI is
  synchronous with no job queue; documented partitioning not implemented.
- **Risk:** Critical for multi-instance/serverless correctness (rate limit) and cost/latency (AI).
- **Recommendation:** Provision Redis; persist the skeleton repos (DEBT-014/016); move AI to a
  queue/precompute.
- **Priority:** Critical (rate limit) / High (persistence, queue).

### 18. Deployment — 6/10

- **Description:** CI runs lint→typecheck→prettier→test→build with build-time placeholders (no
  secrets); multi-stage standalone Dockerfile with non-root user; Railway + Vercel configs; a
  `/api/health` readiness probe.
- **Risk:** Medium. No CD/deploy job, **no `prisma migrate deploy` step**, no DB service +
  integration-test job in CI (DEBT-012), **two hosting targets configured** (Railway _and_
  Vercel — pick one), no error monitoring/observability (Sentry/logs), no staging env.
- **Recommendation:** Pick one host; add a deploy pipeline that runs migrations; add a Postgres
  CI job; add error monitoring before beta.
- **Priority:** High.

---

## Top blockers to beta (ranked)

1. **CRITICAL — Provision Postgres + apply migrations + seed** (DEBT-004). Nothing runs end-to-end
   without it.
2. **CRITICAL — Supabase→profiles/role sync** (DEBT-008). Real signups are unusable without it.
3. **CRITICAL — Get AI out of the `/learn/today` render path** (Performance). The core page can hang.
4. **CRITICAL — Redis-backed rate limiter** (Security/Scalability). Brute-force protection is
   otherwise bypassable in production.
5. **HIGH — Loading/error boundaries + skeletons; mobile nav; a11y (aria-live, field errors,
   non-color quiz feedback).**
6. **HIGH — API query validation (400 not 500); fix vocabulary repo edge bugs (BUG-001/002);
   security headers; error monitoring; pick one host + migrate-on-deploy.**

See [MASTER_BACKLOG.md](../MASTER_BACKLOG.md) for the full, prioritized work list to v1.0.
