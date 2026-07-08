# MASTER_BACKLOG.md — English AI v1.0

> The single, prioritized list of **everything remaining to ship AI English v1.0**, produced by
> the beta-readiness review (2026-07-01). Sorted **Critical → High → Medium → Low**. Each item
> links to its evidence in `reports/`. This is a planning artifact — no code was changed to
> produce it.
>
> **Current state:** the vocabulary learning loop is code-complete and green (81 tests,
> typecheck/lint/build pass), with a clean hexagonal architecture and a real AI provider chain.
> **Beta verdict:** not public-beta-ready until the Critical block clears — then a closed alpha is
> viable. Overall readiness **6.8/10**. See [reports/beta-readiness.md](./reports/beta-readiness.md).

Legend: **P** = priority · **Est** = rough size (S<½d, M~~1–2d, L~~3–5d) · refs → `reports/`.

---

## 🔴 CRITICAL — beta blockers (must all clear before any beta)

| ID   | Item                                                                                                                                                                                                                                                        | Est | Refs                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --------------------------------------- |
| C-01 | **Provision Postgres/Supabase; apply migrations (`prisma migrate deploy`) + seed** (RBAC + CEFR-A1 + 100 words). Nothing runs E2E without this.                                                                                                             | M   | DEBT-004; beta §3                       |
| C-02 | **Supabase→`profiles`/`user_roles` sync** — trigger (`AFTER INSERT ON auth.users`, SECURITY DEFINER) or transactional provisioning in `/auth/callback`, assigning default `student`. Without it, real signups have empty permissions and FK inserts reject. | M   | DEBT-008; security SEC-01               |
| C-03 | **Move AI generation out of the `/learn/today` SSR render path** — render deterministic fallback immediately, hydrate AI text via a client request / precompute; cap this feature's timeout; disable provider fallback for it. Prevents ~100s page hang.    | M   | DEBT-023; perf PERF-01                  |
| C-04 | **Redis-backed rate-limit store** via the existing `setRateLimitStore()` seam. In-memory limiter is bypassable on serverless (auth brute-force).                                                                                                            | S   | DEBT-010; security SEC-02; perf PERF-02 |
| C-05 | **Verify the full loop E2E on a real DB** — login → today's lesson (add word) → quiz (results/explanations) → review (SRS) → dashboard reflects progress/streak/queue.                                                                                      | M   | beta go/no-go                           |

## 🟠 HIGH — required for a safe, usable, credible beta

| ID   | Item                                                                                                                                                                                                             | Est | Refs                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------- |
| H-01 | **Loading/error/not-found boundaries + a `Skeleton` primitive** for the `(dashboard)` group (no boundaries today → unstyled crash pages).                                                                        | M   | DEBT-026; UI/a11y audit      |
| H-02 | **Mobile navigation (bottom tab bar)** — nav currently disappears below 640px.                                                                                                                                   | S   | DEBT-027                     |
| H-03 | **Accessibility (WCAG 2.2 AA) pass** — `aria-live`/`role="status"` on quiz + flashcard results; pair color with text/icon labels; associate field errors (`aria-invalid`/`aria-describedby`); label quiz inputs. | M   | DEBT-028; beta §13           |
| H-04 | **Security headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy).                                                                                                                      | S   | DEBT-024; security SEC-04    |
| H-05 | **Persist learning sessions** — `learning_sessions` table (DB gate) + Prisma repo replacing the in-memory skeleton, so streak/history survive across requests.                                                   | M   | DEBT-016                     |
| H-06 | **BUG-001** — make `setFavorite` ownership-scoped + atomic (currently 500 / cross-user leak on foreign id).                                                                                                      | S   | bug-list BUG-001             |
| H-07 | **API query validation (400 not 500)** — trim `q`; validate catalog/learning enum params via zod; idempotent `addToLearning` (BUG-002/003/004).                                                                  | M   | bug-list; security SEC-09    |
| H-08 | **Deployment pipeline** — pick ONE host (Railway _or_ Vercel), add CD that runs `migrate deploy`, add a Postgres CI job + integration tests (DEBT-012), add error monitoring (Sentry).                           | M   | DEBT-031/012; beta §18       |
| H-09 | **Trusted client-IP resolution** for rate-limit/audit (ignore spoofable `x-forwarded-for`).                                                                                                                      | S   | DEBT-025; security SEC-03    |
| H-10 | **Verify AI against live provider APIs** (real Claude/OpenAI keys) — request/response shapes only fake-tested today.                                                                                             | S   | DEBT-021                     |
| H-11 | **AI abuse controls before enabling generation** — per-user daily token/call quota (enforced via `ai_usage_logs`) + output moderation + prompt-injection delimiting.                                             | M   | DEBT-018; security SEC-05/07 |

## 🟡 MEDIUM — quality, correctness, and post-beta enablement

| ID   | Item                                                                                                                                                 | Est | Refs                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------- |
| M-01 | **Generation cache** (content-hash) — implement the `cache_hit` the schema already anticipates; cut AI cost/latency.                                 | M   | DEBT-020; perf PERF-03     |
| M-02 | **Async AI job pipeline** (queue/worker) + persist `prompt_templates`/`generation_history`.                                                          | L   | DEBT-014; perf PERF-04/05  |
| M-03 | **Dashboard query consolidation + caching** — collapse ~7 count queries; `unstable_cache`/`revalidate`.                                              | S   | perf PERF-07               |
| M-04 | **Search index** — `pg_trgm` GIN on `vocabularies.word` (new migration); avoid full scans; consider keyset pagination.                               | S   | perf PERF-08; beta §3      |
| M-05 | **Slim `select` for card contexts** — stop over-fetching the full word graph in review/quiz paths.                                                   | S   | perf PERF-09               |
| M-06 | **Promote pagination to `src/lib`** — remove the cross-module domain import across 5 files.                                                          | S   | DEBT-022/006; arch ARCH-01 |
| M-07 | **Learning-engine seed + Progress** — sample content so its endpoints aren't empty; implement `recordProgress` (or explicitly exclude from beta UI). | M   | DEBT-009; bug-list BUG-005 |
| M-08 | **`ai.generate` permission** — add and gate AI admin tools/routes.                                                                                   | S   | DEBT-015; security SEC-06  |
| M-09 | **Tooling deprecations** — migrate off `next lint` (ESLint flat config) and Prisma seed config (`prisma.config.ts`).                                 | S   | DEBT-002/003               |
| M-10 | **Middleware cost** — tighten the matcher to exclude static/prefetch; consider per-request user memoization.                                         | S   | DEBT-007; perf PERF-06     |
| M-11 | **`next/image`** for word images/audio when media renders in beta.                                                                                   | S   | perf PERF-10               |
| M-12 | **AI cost pricing** — populate `cost_micro_usd` from a per-model price table for the cost dashboard.                                                 | S   | DEBT-019                   |

## 🟢 LOW — polish, cleanups, nice-to-haves

| ID   | Item                                                                              | Est | Refs                   |
| ---- | --------------------------------------------------------------------------------- | --- | ---------------------- |
| L-01 | Delete dead `StubLlmAdapter`; repoint its test to `UnconfiguredProvider`.         | S   | DEBT-029; arch ARCH-03 |
| L-02 | Extract `HttpLlmProvider` base / `safeErrorDetail` helper (provider duplication). | S   | DEBT-030; arch ARCH-02 |
| L-03 | `pageSize=0` explicit handling (absent vs zero) (BUG-006).                        | S   | DEBT-013               |
| L-04 | Tag `slug` vs `name` consistency between list filter and detail (BUG-007).        | S   | bug-list BUG-007       |
| L-05 | Atomic PATCH when `rating` + `isFavorite` sent together (BUG-008).                | S   | bug-list BUG-008       |
| L-06 | Thread the injected clock into `stats()` (testability) (BUG-009).                 | S   | bug-list BUG-009       |
| L-07 | `prefers-reduced-motion` support (ahead of celebration animations).               | S   | UI/a11y audit          |
| L-08 | Personalized daily-lesson selection (skip mastered, prefer weak/new).             | M   | DEBT-017               |
| L-09 | `requireApiPermission(code)` helper for future privileged API routes.             | S   | security SEC-08        |
| L-10 | Document the `presentation/` convention (route handlers live in `src/app`).       | S   | arch ARCH-07           |

---

## Suggested release path

1. **Alpha (internal):** Critical block (C-01…C-05). Team can exercise the real loop on a real DB.
2. **Closed beta:** + High block (H-01…H-11). Safe, accessible, mobile-usable, monitored, AI-verified.
3. **v1.0 (public):** + Medium block (caching, async AI, search, learning-engine content, polish).
4. **Continuous:** Low block folded into normal Boy-Scout cleanups.

**Definition of v1.0 done:** the vocabulary learning loop runs on a provisioned, monitored,
single-host deployment; real signups get a usable account; the core pages are fast and accessible;
AI explanations are cached, quota'd, moderated, and verified against live providers; and no Critical
or High item remains open. Estimated Critical+High effort ≈ **3–4 focused engineer-weeks** (excluding
provider/DB provisioning lead time).
