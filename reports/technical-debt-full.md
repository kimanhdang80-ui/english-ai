# Technical Debt (Full) — English AI

> Review-only consolidation of the **existing living ledger** (`reports/technical-debt.md`,
> DEBT-001…021) **plus newly discovered debt from this beta-readiness review** (DEBT-022…031,
> proposed — not yet merged into the living ledger; this report does not edit code or the ledger).
> Cross-ref: [beta-readiness](./beta-readiness.md), [refactor-roadmap](./refactor-roadmap.md).

## A. Existing ledger (status as reviewed)

| ID       | Sev  | Status    | Summary                                                                                         |
| -------- | ---- | --------- | ----------------------------------------------------------------------------------------------- |
| DEBT-001 | High | RESOLVED  | Automated tests added (Vitest).                                                                 |
| DEBT-002 | Med  | OPEN      | `next lint` deprecated → migrate to ESLint CLI/flat config before Next 16.                      |
| DEBT-003 | Low  | OPEN      | Prisma seed config deprecated → `prisma.config.ts` before Prisma 7.                             |
| DEBT-004 | High | PARTIAL   | **Migrations authored but not applied on a live DB** (incl. `ai_usage_logs`). **Beta blocker.** |
| DEBT-005 | Low  | RESOLVED  | Duplicate review-card mapping extracted (`toReviewCard`). Verified closed.                      |
| DEBT-006 | Med  | SCHEDULED | Vocabulary imports pagination from learning/domain (see DEBT-022 — wider than logged).          |
| DEBT-007 | Med  | OPEN      | Edge middleware `getUser()` network call per request.                                           |
| DEBT-008 | High | SCHEDULED | **Supabase→profiles/role sync missing.** **Beta blocker** (see security SEC-01).                |
| DEBT-009 | Med  | SCHEDULED | Learning-engine authoring absent; `ProgressService` 501.                                        |
| DEBT-010 | Med  | OPEN      | In-memory rate-limit store not shared across instances (see security SEC-02). **Beta blocker.** |
| DEBT-011 | Low  | OPEN      | Auth uses Server Actions while content uses REST — consumer-clarity gap.                        |
| DEBT-012 | Med  | PARTIAL   | No Postgres service + repository integration tests in CI.                                       |
| DEBT-013 | Low  | OPEN      | `pageSize=0` ambiguity (see BUG-006).                                                           |
| DEBT-014 | Med  | PARTIAL   | AI provider wired; `prompt_templates`/`generation_history` persistence + async jobs pending.    |
| DEBT-015 | Low  | OPEN      | No dedicated `ai.generate` permission (see security SEC-06).                                    |
| DEBT-016 | Med  | OPEN      | Learning-session persistence is an in-memory skeleton. **Beta-relevant.**                       |
| DEBT-017 | Low  | OPEN      | Daily lesson not personalized (corpus-order words).                                             |
| DEBT-018 | Med  | OPEN      | No AI evaluation harness / output moderation (see security SEC-05).                             |
| DEBT-019 | Low  | OPEN      | `ai_usage_logs.cost_micro_usd` always 0 (not priced).                                           |
| DEBT-020 | Low  | OPEN      | No generation caching (`cache_hit` always false) (see perf PERF-03).                            |
| DEBT-021 | Med  | OPEN      | Providers unverified against live APIs (no keys/network).                                       |

## B. Newly discovered this review (proposed IDs)

| ID       | Sev  | Type           | Location                                                                | Description                                                                                          | Proposed action                                                                   |
| -------- | ---- | -------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| DEBT-022 | Med  | arch-coupling  | vocabulary + presentation (5 files)                                     | DEBT-006 is **wider than logged** — the cross-module pagination import spans presentation too.       | Promote pagination to `src/lib/pagination.ts` (ARCH-01).                          |
| DEBT-023 | Crit | performance    | `daily-loop/.../daily-lesson-service.ts` → `learn/today`                | ~5 AI calls awaited inside SSR render → up to ~100s tail; blocks the core page (PERF-01).            | Move AI out of the render path (lazy/precompute/cache).                           |
| DEBT-024 | High | security       | `next.config.mjs`                                                       | No security headers (CSP/HSTS/X-Frame/X-Content-Type/Referrer) (SEC-04).                             | Add a `headers()`/middleware security-header block.                               |
| DEBT-025 | Med  | security       | `src/lib/security/request-context.ts`                                   | Spoofable `x-forwarded-for` for rate-limit/audit keys (SEC-03).                                      | Use the platform's trusted real-IP; ignore untrusted XFF.                         |
| DEBT-026 | High | ux/reliability | `src/app/(dashboard)/**` (no `loading.tsx`/`error.tsx`/`not-found.tsx`) | No Suspense/error boundaries or skeletons; a thrown fetch shows an unstyled default page.            | Add loading/error/not-found for the dashboard group; add a `Skeleton` primitive.  |
| DEBT-027 | High | ux/responsive  | `src/app/(dashboard)/layout.tsx`                                        | Nav is `hidden … sm:flex` with no mobile menu → app nav disappears below 640px.                      | Add a mobile bottom-nav (UI_GUIDELINE §9).                                        |
| DEBT-028 | High | accessibility  | `quiz-session.tsx`, `flashcard-session.tsx`, `auth/form-feedback.tsx`   | No `aria-live` on dynamic results; color-only correct/incorrect; field errors not associated.        | Live regions + text/icon labels; `aria-invalid`/`aria-describedby` (WCAG 2.2 AA). |
| DEBT-029 | Low  | dead-code      | `src/modules/ai/infrastructure/stub-llm-adapter.ts`                     | Dead in production (replaced by `ProviderFactory`/`UnconfiguredProvider`); only a test uses it.      | Delete prod file; repoint test to `UnconfiguredProvider` (ARCH-03).               |
| DEBT-030 | Low  | duplication    | `claude-provider.ts` + `openai-provider.ts`                             | `safeErrorDetail` + `complete()` scaffold duplicated (ARCH-02).                                      | Extract `HttpLlmProvider` base / shared helper.                                   |
| DEBT-031 | High | deployment     | `.github/workflows/ci.yml`, `railway.json` + `vercel.json`              | No CD/`migrate deploy` step; no DB/integration CI job; **two hosting targets**; no error monitoring. | Pick one host; add deploy+migrate pipeline; add Postgres CI job + Sentry.         |

## C. Debt heat-map (by area)

- **Beta blockers (Critical):** DEBT-004 (apply DB), DEBT-008 (profiles sync), DEBT-023 (AI in SSR),
  DEBT-010 (rate-limit store).
- **Beta hardening (High):** DEBT-024 (headers), DEBT-026 (loading/error), DEBT-027 (mobile nav),
  DEBT-028 (a11y), DEBT-031 (deploy pipeline), DEBT-016 (session persistence), DEBT-018 (AI
  moderation), DEBT-021 (verify live AI), BUG-001.
- **Post-beta (Medium/Low):** DEBT-009/017 (learning engine + personalization), DEBT-014/019/020
  (AI persistence/cost/cache), DEBT-002/003 (tooling deprecations), DEBT-022/030 (coupling/dup),
  DEBT-006/011/013/015/025/029, BUG-002…009.

## D. Debt hygiene assessment

The living ledger is **genuinely good** — severity/status/target columns, RESOLVED items annotated
with "how," no silent fixes. Score **7/10**: docked only because several skeletons (in-memory
session/AI repos, 501 services) and one dead file ship in production, and this review surfaced ~10
items the ledger hadn't yet captured (expected — they emerged from a dedicated audit).
