# Refactor Roadmap — English AI

> Review-only. A phased, dependency-aware plan to turn the audit findings into scheduled work.
> Refactors are grouped so each phase is shippable and test-gated. Cross-ref:
> [technical-debt-full](./technical-debt-full.md), [beta-readiness](./beta-readiness.md),
> [MASTER_BACKLOG](../MASTER_BACKLOG.md). No code changed by this review.

## Principles

- **Behavior-preserving refactors are separate from bug fixes and features** (CLAUDE.md §8).
- **Coverage first:** add the missing Postgres integration tests (DEBT-012) _before_ touching the
  vocabulary repos, so BUG-001/002 fixes are characterization-tested.
- **No refactor without a ledger entry** (PROJECT_OS §7). New items DEBT-022…031 feed this plan.

## Phase 0 — Enable safe change (foundation)

| Item     | Work                                                                  | Unblocks       |
| -------- | --------------------------------------------------------------------- | -------------- |
| DEBT-004 | Provision Postgres/Supabase; `prisma migrate deploy` + `prisma:seed`. | everything E2E |
| DEBT-012 | Add a Postgres service + repository integration-test job in CI.       | repo refactors |

## Phase 1 — Beta-blocking refactors (Critical)

| Item             | Refactor                                                                                                                                                                                                                          | Notes                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-023/PERF-01 | Move AI generation out of the `/learn/today` SSR path — render deterministic fallback, hydrate AI text via a client request or precompute at content time. Introduce a small `AiExplanationController`/route for on-demand fetch. | Behavior-preserving from the learner's POV (text still appears); removes the render-time await. Cap timeout + disable provider fallback for this feature. |
| DEBT-008/SEC-01  | Introduce a profile/role provisioning seam — a Postgres trigger **or** a `ProvisionProfileService` invoked in `/auth/callback`.                                                                                                   | Data-layer change (trigger) needs the DB gate; app-layer version is a new service + call.                                                                 |
| DEBT-010/SEC-02  | Extract the rate-limit store behind the existing `setRateLimitStore()` seam and add a `RedisRateLimitStore` adapter.                                                                                                              | Seam already exists — this is an adapter + wiring, not a rewrite.                                                                                         |

## Phase 2 — Beta-hardening refactors (High)

| Item         | Refactor                                                                                                                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEBT-016     | Replace `InMemorySessionRepository` with a `PrismaLearningSessionRepository` (needs `learning_sessions` table via DB gate). Same port, swap at container.                                                  |
| DEBT-026     | Add `loading.tsx`/`error.tsx`/`not-found.tsx` for the `(dashboard)` group; extract a `Skeleton` UI primitive; wrap data sections in Suspense.                                                              |
| DEBT-028     | A11y refactor of `quiz-session.tsx`/`flashcard-session.tsx` (add `role="status" aria-live`; pair color with text/icon labels) and `auth/*` (associate `FieldError` via `aria-invalid`/`aria-describedby`). |
| DEBT-027     | Extract a `MobileNav` (bottom tab bar) from `(dashboard)/layout.tsx`.                                                                                                                                      |
| DEBT-024/025 | Add a security-headers layer (`next.config` `headers()` or middleware); centralize trusted client-IP resolution in `request-context.ts`.                                                                   |
| BUG-001/002  | Vocabulary repo hardening: atomic `setFavorite` (scoped re-fetch); idempotent `addToLearning` (`upsert`/catch P2002). Characterization-tested first.                                                       |
| DEBT-031     | Consolidate to one hosting target; add a deploy pipeline that runs `migrate deploy`; add error monitoring (Sentry).                                                                                        |

## Phase 3 — Structural cleanup (Medium/Low, behavior-preserving)

| Item            | Refactor                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| DEBT-022/006    | Promote pagination to `src/lib/pagination.ts`; update the 5 importers (vocabulary + presentation). Pure move + re-export.   |
| DEBT-030        | Extract `HttpLlmProvider` base (or `fetchWithTimeout` + `safeErrorDetail`) shared by Claude/OpenAI adapters.                |
| DEBT-029        | Delete `StubLlmAdapter`; repoint its test to `UnconfiguredProvider`.                                                        |
| BUG-003/004/006 | Add boundary query-validation (zod) for catalog/learning endpoints (trim `q`, validate enums → 400, explicit `pageSize=0`). |
| DEBT-002/003    | Migrate off `next lint` (ESLint flat config) and Prisma seed config (`prisma.config.ts`) ahead of major-version bumps.      |

## Phase 4 — Post-beta enablement (Medium/Low, feature-adjacent)

| Item         | Work                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ |
| DEBT-014     | Persist `prompt_templates`/`generation_history` (DB gate); async AI job pipeline (queue/worker). |
| DEBT-018     | AI evaluation harness (golden datasets) + output moderation + prompt-injection delimiting.       |
| DEBT-019/020 | AI cost pricing table (`cost_micro_usd`) + generation cache (`cache_hit`).                       |
| DEBT-009/017 | Learning-engine authoring/publish + progress; personalized daily-lesson selection.               |
| DEBT-015     | Add `ai.generate` permission and gate AI admin tools/routes.                                     |

## Sequencing rationale

Phase 0 must precede everything (no verification without a DB). Phase 1 removes the four Critical
beta blockers. Phase 2 makes the beta _safe and usable_ (persistence, a11y, error UX, mobile, deploy).
Phases 3–4 are behavior-preserving cleanups and post-beta features — deliberately after the beta cut
so they don't destabilize the release.
