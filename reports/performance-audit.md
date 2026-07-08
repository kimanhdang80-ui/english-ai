# Performance & Scalability Audit — English AI

> Review-only. Scope: DB design, Prisma usage, hot paths, scalability/statefulness, caching,
> frontend. Cross-ref: [beta-readiness](./beta-readiness.md) §3/§4/§11/§17. No code changed.

## Scores

| Area        | Score | Justification                                                                                      |
| ----------- | ----- | -------------------------------------------------------------------------------------------------- |
| Database    | 8/10  | Normalized, correct onDelete + composite indexes; missing search index; partitioning aspirational. |
| Prisma      | 7/10  | Clean singleton/select/tx; over-fetches word graph on card paths; one non-atomic write.            |
| Performance | 3/10  | ~5 real AI calls awaited inside `/learn/today` SSR (up to ~100s tail); no gen cache.               |
| Scalability | 3/10  | In-memory rate-limit/session/AI-history stores; no Redis/CDN; AI synchronous, no queue.            |

## Findings

| ID      | Severity | Location                                                                                                     | Issue                                                                                                                           | Recommendation                                                                                                                                                          | Priority |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| PERF-01 | Critical | `src/modules/daily-loop/application/services/daily-lesson-service.ts` (`buildQuiz`) → `learn/today/page.tsx` | ~5 explanation calls awaited during SSR; timeout 20s × retries 2 × optional provider fallback → ~100s tail; blocks page stream. | Render deterministic fallback immediately; hydrate AI text via a separate client request or precompute/cache; cap timeout + disable provider fallback for this feature. | Critical |
| PERF-02 | Critical | `src/lib/security/rate-limit.ts`                                                                             | In-memory store → per-instance limits on serverless; auth throttle bypassable.                                                  | Redis-backed store (Upstash) injected at startup.                                                                                                                       | Critical |
| PERF-03 | High     | `src/modules/ai/application/services/ai-text-service.ts`, `providers/*`                                      | No caching of deterministic generations; `ai_usage_logs.cache_hit` exists but always `false`.                                   | Content-addressed cache (hash of templateKey+version+variables) in Redis/DB before provider call.                                                                       | High     |
| PERF-04 | High     | `src/modules/ai/infrastructure/repositories.ts`, `daily-loop/infrastructure/in-memory-session-repository.ts` | In-memory prompt-template/generation-history/session repos are per-instance + ephemeral (wired in prod containers).             | Back with `prompt_templates`/`generation_history`/`learning_sessions` tables (DB gate).                                                                                 | High     |
| PERF-05 | High     | AI call path (no queue)                                                                                      | Slow/expensive AI is synchronous in the request path; no job queue.                                                             | Offload generation to a queue/worker or precompute; poll/stream results.                                                                                                | High     |
| PERF-06 | Med      | `src/middleware.ts` + `src/lib/supabase/middleware.ts`                                                       | `supabase.auth.getUser()` network round-trip per matched request.                                                               | Correct for security; tighten matcher to exclude static/prefetch; consider per-request memoization.                                                                     | Medium   |
| PERF-07 | Med      | `src/app/(dashboard)/dashboard/page.tsx` + `vocabulary` repo `getStats`                                      | Dashboard fans out ~7 count queries per render, uncached.                                                                       | Collapse counts into one grouped/`$queryRaw` aggregate; add `unstable_cache`/`revalidate`.                                                                              | Medium   |
| PERF-08 | Med      | `prisma/schema.prisma` (`Vocabulary.word` btree) + `repositories.ts` `list`                                  | `word ILIKE '%q%'` search is unindexable → full scan; offset pagination degrades deep.                                          | Add `pg_trgm` GIN index (new migration); consider keyset pagination for large catalogs.                                                                                 | Medium   |
| PERF-09 | Med      | `src/modules/vocabulary/infrastructure/repositories.ts` (`quizItems`/`listDue`/`listStudySet`)               | Over-fetch full word graph (meanings/examples/pronunciations/audios/images/tags) for card contexts.                             | Slim `select`/include for cards; reserve full include for the detail page.                                                                                              | Medium   |
| PERF-10 | Low      | `src/**/*.tsx`                                                                                               | No `next/image` — word images/audio render as raw `<img>` (no optimization/lazy-load).                                          | Use `next/image` when media renders in beta.                                                                                                                            | Low      |
| PERF-11 | Low/Info | `DATABASE.md` vs migrations                                                                                  | Documented monthly range-partitioning of hot append-only tables not yet DDL.                                                    | Track as scale-phase work; not needed pre-scale.                                                                                                                        | Low      |

## Done well (keep)

- **`recordReview` is atomic** — `$transaction` updates SRS state + appends `ReviewHistory`.
- **Prisma singleton** is textbook (global reuse guarded to non-production).
- **Indexes match query paths** — `(userId,dueAt)`, `(userId,status)`, `(userId,reviewedAt)`,
  `(parentId,sortOrder)` all serve real reads; lists paginate + filter `deletedAt`.
- **onDelete correctness** — Cascade for owned data, SetNull for audit/logs so history survives.
- **Healthy client/server split** — few `'use client'` leaves; pages are server components.

## Top priorities

1. **PERF-01** — get AI generation out of the `/learn/today` render path (biggest latency risk).
2. **PERF-02** — Redis rate-limit store before production.
3. **PERF-03** — implement the generation cache the schema already anticipates.
4. **PERF-04/05** — persist the in-memory repos and move AI to a queue/precompute.
