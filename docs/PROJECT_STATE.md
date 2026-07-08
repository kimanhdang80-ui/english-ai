# PROJECT_STATE.md — English AI

> Living snapshot of **current reality**. Update in the same PR as any change
> that alters status. This is the first file to read when picking up work.

---

## Current Phase

**Process governance:** **Project OS v1 adopted** ([PROJECT_OS.md](./PROJECT_OS.md)) —
every sprint now runs the mandatory lifecycle (pre-code checklist → post-code pipeline →
6 governance reports; DB/API gates; log-don't-fix; spec supremacy).

**Milestone 1 — Real AI (provider integration): ✅ Complete** (follows Sprint 8.1) —
Claude/OpenAI wired behind the existing `LlmPort` via `ProviderFactory`
(retry/timeout/fallback); vocabulary explanation, example generation, and short-answer
feedback now provider-backed with deterministic fallback; `ai_usage_logs` added via the
DB gate (ADR-0003). No architecture/UI/Learning-Engine change.

**Epic 8 — Daily Learning Loop** · **Sprint 8.1 (MVP): ✅ Complete**
(follows Sprint 7.1) — first complete learn loop; composition only (no new framework, no DB change)

## Status Summary

| Area                        | Status                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product & engineering docs  | ✅ Complete (`docs/`)                                                                                                                                                                                                                                                                                                                                        |
| Project scaffold            | ✅ Next.js 15 + TS strict + Tailwind + shadcn/ui                                                                                                                                                                                                                                                                                                             |
| Auth (Supabase) + RBAC      | ✅ Full auth flows + permission-based RBAC + route protection (Sprint 2.1); **RC-02: `handle_new_user`/`handle_user_delete` triggers (ADR-0004) sync auth.users→profiles→user_roles (default `student`) + delete cleanup** — apply at deploy (no DB here)                                                                                                    |
| Learning Engine core        | ✅ Generic content domain + layered module + `/api/v1` read API (Sprint 3.1)                                                                                                                                                                                                                                                                                 |
| **Vocabulary module**       | ✅ `src/modules/vocabulary` (domain/application/infrastructure) — same layering                                                                                                                                                                                                                                                                              |
| **Vocabulary DB**           | ✅ vocabularies + meanings/examples/pronunciations/audios/images/tags + user_vocabulary + review_history                                                                                                                                                                                                                                                     |
| **SRS**                     | ✅ Deterministic SM-2 lite scheduler (no AI), pure + clock-injected                                                                                                                                                                                                                                                                                          |
| **Vocabulary API**          | ✅ `/api/v1` vocabularies, vocabularies/:id, user-vocabulary (POST/PATCH), reviews/today, stats                                                                                                                                                                                                                                                              |
| **Vocabulary UI**           | ✅ List, Detail, Flashcard (Know/Again/Favorite), Quiz (4 types), Today's Review, Progress — responsive                                                                                                                                                                                                                                                      |
| **Seed**                    | ✅ **100** real A1 words (expanded in 6.1)                                                                                                                                                                                                                                                                                                                   |
| **Migration**               | ✅ Baseline `prisma/migrations/20260701000000_init` (Prisma-generated; applies on a live DB)                                                                                                                                                                                                                                                                 |
| **AI Generator foundation** | ✅ `src/modules/ai` — prompt templates/versions, renderer, validator, difficulty, token estimator; admin UI placeholders                                                                                                                                                                                                                                     |
| **AI provider (real)**      | ✅ `ClaudeProvider`/`OpenAIProvider` (fetch) behind `LlmPort` via `ProviderFactory` — config-driven, retry/timeout/fallback; `AiTextService` (explanation/example/feedback) + graceful fallback; `ai_usage_logs` (Prisma repo, no-op without DB)                                                                                                             |
| **AI production (RC-04)**   | ✅ Circuit breaker (`CircuitBreakerProvider`) + resilience policy env; **cost** per call (`config/pricing.ts` → `ai_usage_logs.cost_micro_usd`); **streaming** (`stream()` SSE on both adapters + decorator delegation); **AI health** (`GET /api/health/ai`); **AI Metrics Dashboard** (`/admin/ai-metrics`). No DB migration; no learning-UI/Engine change |
| **Daily Learning Loop**     | ✅ `src/modules/daily-loop` — daily lesson (10 words+5 quiz+1 review), review queue (NEW/LEARNING/REVIEW/MASTERED), streak (derived); explanation now **real AI** (fallback to mock); `/learn/today`                                                                                                                                                         |
| **Learning Dashboard**      | ✅ Redesigned (Task 01) — Greeting/Streak/Goal · Today's Mission (single CTA) · Today's Review · **AI Coach (mock, swappable)** · Weekly Progress · Weak Words · Recent Activity; skeleton + error states; removed Continue Learning/stats widgets                                                                                                           |
| **Daily Lesson Generator**  | ✅ Task 02 — planner pipeline (Goal→Track→Mission→Activities→Lesson): Rule Engine (default+fallback), Goal/Mission/Activity selectors, `LessonPlannerService` (AI-advisor seam), plan saved (in-memory skeleton); `DailyLessonService` materializes the plan (backward-compatible `DailyLesson.plan`)                                                        |
| **Mission Engine**          | ✅ Task 03 — `src/modules/learning/**/mission`: Mission (center) → Activity (vocab/dialogue/quiz/review; listening/speaking placeholders) → Exercise → Question(+hint); MissionRepository/Service/Planner, ActivityPlanner, CompletionService; in-memory skeletons; Lesson-wraps-Mission adapter (backward compatible; DB via migration P2)                  |
| **Mission Library**         | ✅ Task 04 — 4 tracks × 10 missions = **40** authored as JSON in `content/` (General/Business/Construction/Travel, A1); schema+validation in `src/content`; 320 vocab · 380 dialogue · 400 exercises · 200 review-focus; content-only (no engine/DB/API change), not yet seeded (migration P2/P4)                                                            |
| **Mission Flow (UI)**       | ✅ Task 05 — full flow `/learn/mission/[id]`: Goal→Warmup→Vocabulary→Dialogue→Practice(fill/arrange/match)→Quiz→Reflection→Summary→Review Queue; `/learn/missions` browser; reads library (no engine/DB/library change); session-scoped scoring/review (persist via migration)                                                                               |
| **Tests**                   | ✅ Vitest — **62** unit tests (+streak, status-map, daily lesson); `npm test` in CI                                                                                                                                                                                                                                                                          |
| **Vocabulary spec**         | ✅ `specs/vocabulary/` (Sprint 5.1); implementation conforms (`reports/spec-review.md`)                                                                                                                                                                                                                                                                      |
| **Process (Project OS v1)** | ✅ `docs/PROJECT_OS.md` + `reports/_templates/` (6) + living `reports/technical-debt.md` + `docs/REFACTOR_PLAN.md`                                                                                                                                                                                                                                           |
| **Persistence (RC-03)**     | ✅ In-memory runtime repos retired — Session/Lesson Plan/Mission/Mission Progress/Prompt Template/Generation History now **Prisma-backed** (ADR-0005, migration `20260702010000_persistence_stores`, 8 tables); Mission Library read from DB (`content_*`), JSON = seed only; apply at deploy (no DB here)                                                   |
| Prisma schema               | ✅ **47** tables; validated + client generated (RC-03 added 8 persistence stores; migration drift-free via `migrate diff`)                                                                                                                                                                                                                                   |
| Tooling / CI                | ✅ ESLint · Prettier · typecheck · build                                                                                                                                                                                                                                                                                                                     |
| Architecture governance     | ✅ ADR-0001/0002 + DECISIONS.md (D-0001…D-0021) + `ARCHITECTURE_EVOLUTION.md`                                                                                                                                                                                                                                                                                |
| Build / typecheck / lint    | ✅ All green locally                                                                                                                                                                                                                                                                                                                                         |

## What Exists Today

- Full documentation set in `docs/` (+ ADR-0001/0002, DECISIONS.md, `ARCHITECTURE_EVOLUTION.md`).
- **Authentication foundation** (Sprint 2.1): Supabase Auth flows, permission-based RBAC,
  Edge+Node route protection, auth/profile/settings/admin UI, security + audit.
- **Learning Engine core** (Sprint 3.1): generic content domain, layered module, `/api/v1` read API.
- **Vocabulary MVP** (Sprint 4.1): a **usable** feature — browse/search A1 words, add to
  learning, flashcards with SRS (Know/Again/Favorite), 4-type quiz, Today's Review, and
  progress stats. Backed by `src/modules/vocabulary` + `/api/v1` vocabulary API + ~60
  seeded A1 words. **No AI.**
- **Prisma schema:** 39 tables; validated; client generated. Migrations + seed apply in a DB env.
- Reserved monorepo scaffolding (`apps/*`, `packages/*`) — README placeholders.
- Grammar/listening/reading/AI: not started (by design).

## Decisions Locked / Updated

- **Architecture (reaffirmed in Sprint 1.2 — [ADR-0001](./adr/ADR-0001.md)):**
  MVP is a **single Next.js full-stack app** with **Supabase Auth**, deploying to
  **Vercel** (web) + **Railway** (container). Evolution path (worker/realtime split)
  is documented with explicit triggers in
  [ARCHITECTURE_EVOLUTION.md](./ARCHITECTURE_EVOLUTION.md).
- **Governance:** ADRs follow a unified template ([docs/adr/README.md](./adr/README.md));
  package/deployment boundaries are decoupled (boundaries first, deploys later).
- TypeScript strict everywhere; `@/*` path alias.
- DB: PostgreSQL + Prisma (Supabase Postgres in production).
- **Identity (new — [ADR-0002](./adr/ADR-0002.md)):** Supabase owns `auth.users`; our
  `profiles` (id = auth uid) owns app identity; authorization is **permission-based
  RBAC** (never role-name checks). Sprint 1's `User`/`UserProfile`/`AuthAccount` removed.
- **Learning Engine (new — [DECISIONS.md](./DECISIONS.md) D-0009…D-0016):** one
  content-type-agnostic engine; versioned content (`LessonVersion`); permission-checked
  authoring later; `src/modules/learning` layered domain/application/infrastructure.
- **Vocabulary (new — [DECISIONS.md](./DECISIONS.md) D-0017…D-0021):** own module,
  deterministic SRS (no AI), shared `DomainError`, seeded A1 corpus is product content.
- AI: Claude-first behind provider-agnostic ports — **now wired for real** (Milestone 1).
- Package manager: **npm** (pnpm not available in the current environment).

## In Progress

- Nothing — Milestone 1 closed (real AI providers behind `LlmPort`; no arch/UI change).

## Next Up

➡️ **Sprint 8.2 — Persist the loop + provision DB** (the recurring blocker): stand up
Postgres/Supabase, apply the migrations (incl. the new `ai_usage_logs`) + seed (100 words),
and add a `learning_sessions` table (DB gate) so streak/history/sessions persist across
requests — then verify the loop end-to-end and add integration tests. Closes DEBT-004/012/016
and enables AI-usage persistence + live provider verification (DEBT-021). Parallel tracks:
**Sprint 2.2** (profiles sync), **Sprint 3.2** (authoring), **AI quality** (eval harness /
moderation, DEBT-018). See [NEXT_TASK.md](./NEXT_TASK.md), [MVP_CHECKLIST.md](./MVP_CHECKLIST.md),
and [reports/technical-debt.md](../reports/technical-debt.md).

## Blockers / Open Questions

- **Provision a real Supabase project + Postgres** and run `prisma migrate deploy` +
  `prisma:seed` (no local Docker/DB in the build environment).
- Define the **Supabase → `profiles` sync** (DB trigger vs webhook) and default-role grant.
- STT/TTS/pronunciation vendor selection — Sprint 20–22 (adapters keep this reversible).
- Initial curriculum content source — decide before content epics.

## Key Metrics (targets, not yet measured)

- MVP by end of Sprint 16 · AI platform by Sprint 24 · Monetized by Sprint 30.

---

_Last updated: 2026-07-03 — DEPLOY-01: Vercel deploy prep — Prisma `directUrl` added, `db:release` (migrate deploy + seed) scripts, `.env.example` updated (DIRECT_URL + circuit vars); `VERCEL_DEPLOY.md` + `DEPLOY_CHECKLIST.md`; no feature/UI/refactor; build + 175 tests green (only a non-blocking Prisma 6→7 deprecation warning). (Prev: RC-04 — AI Production Ready.)_

_Earlier: 2026-07-02 — RC-04: AI Production Ready — added circuit breaker + resilience-policy env, per-call cost (`ai_usage_logs.cost_micro_usd`), token streaming (SSE on Claude/OpenAI + decorator delegation), AI health probe (`GET /api/health/ai`), and the AI Metrics Dashboard (`/admin/ai-metrics`); no DB migration, no learning-UI/Engine change; 175 tests (+22); typecheck+lint+build+format green. (Prev: RC-03 — Persistence Production Ready.)_

_Earlier: RC-03: Persistence Production Ready — retired every in-memory runtime repository; Session/Lesson Plan/Mission/Mission Progress/Prompt Template/Generation History now Prisma-backed and the Mission Library reads from the DB (JSON = seed only), via ADR-0005 + additive migration `20260702010000_persistence_stores` (8 tables, 39→47); ports/UI/UX unchanged; seed extended (mission library + prompt templates); 153 tests; typecheck+lint+build+format+prisma-validate green (apply at deploy). (Prev: RC-02 — Auth Production Ready.)_
