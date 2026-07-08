# PRODUCTION_AUDIT.md — Persistence & Production Audit (pre-Beta)

> Role: Principal Software Architect. **Read-only audit** — no code/refactor/migration. Scanned
> `src/**`, `content/**`, `prisma/**` for `mock · seed · placeholder · in-memory · temporary · TODO · FIXME · fake · NotImplemented`, and traced the real data source of each key module.
> Companion: [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md). Continuity:
> [reports/beta-readiness.md](./reports/beta-readiness.md), [reports/technical-debt.md](./reports/technical-debt.md).
> Date: 2026-07-02.

---

## 0. Executive summary

The codebase is **feature-complete and green** (typecheck · lint · 127 tests · build), with clean
architecture and real authored content. **What is missing is production wiring, not features:**
there is **no live database**, no Supabase→profile sync, several **in-memory skeleton stores**
(sessions, lesson plans, mission engine, AI templates/history), the **Mission Library isn't seeded**
into the DB, the **rate limiter is in-memory**, and **AI has no keys** (runs on deterministic
fallback). Until these are provisioned, no real user can complete the loop end-to-end.

**Beta readiness: ~58% (see §5).**

## 1. Module data-reality matrix

Legend: 🟢 real data (DB/content) · 🟡 real logic but not persisted / degraded · 🔴 not real (mock/in-memory/501).

| Module             | Data source today                                                                                             | Verdict | Blocking gap                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| **Authentication** | Supabase Auth (real) + Prisma `profiles`/RBAC                                                                 | 🟡      | No live DB; **no Supabase→profiles/role sync** → new users get no profile/role |
| **Mission**        | Engine code real; `InMemoryMissionRepository` + `InMemoryUserProgress`; **library JSON not seeded to DB**     | 🔴      | Storage in-memory; content not in DB; progress not persisted                   |
| **Review Queue**   | Derived from `user_vocabulary` via Prisma (real logic)                                                        | 🟡      | Needs live DB + seed; correct once provisioned                                 |
| **Daily Lesson**   | Rule-engine planner (real) + corpus from DB; **lesson plan saved in-memory**; explanation = mock when AI off  | 🟡      | Plan not persisted; AI not configured                                          |
| **Progress**       | Dashboard `getStats` = real (DB); **learning-engine `ProgressService` = 501**                                 | 🟡      | Engine progress unimplemented; needs DB                                        |
| **Weak Words**     | Dashboard reads review-queue items (real, DB)                                                                 | 🟢      | Needs live DB; logic real                                                      |
| **Session**        | `InMemorySessionRepository` (ephemeral)                                                                       | 🔴      | Not persisted → Recent Activity empty; lost on restart                         |
| **AI**             | Real provider chain (Claude/OpenAI) but **no API keys** → deterministic fallback; templates/history in-memory | 🟡      | No keys; templates/history not persisted; no moderation/quota                  |
| **Streak**         | Derived from `review_history` via Prisma (real)                                                               | 🟢      | Needs live DB; logic real                                                      |
| **Dashboard**      | stats/queue/streak/weak-words real (DB); **AI Coach = mock**; **Recent Activity empty** (sessions in-memory)  | 🟡      | Coach mock; recent activity needs session persistence                          |

## 2. Findings — CRITICAL (blocks any real beta)

| ID    | File / Module                                                            | Finding                                                                                                                  | Impact                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PA-C1 | `prisma/` · `src/lib/env.ts` (`isDatabaseConfigured`)                    | **No live database provisioned; migrations authored but not applied** (DEBT-004).                                        | Whole app: every DB-backed module (auth, vocabulary, review, streak, progress) is inert until a Postgres/Supabase instance exists and `prisma migrate deploy` + `prisma:seed` run. |
| PA-C2 | `prisma/migrations/**` (no `handle_new_user` trigger) · `src/lib/auth/*` | **No Supabase→`profiles`/`user_roles` sync** (DEBT-008). A verified user has no profile row and an empty permission set. | Authentication: real sign-ups can't use the app (RBAC fails, FK inserts reject).                                                                                                   |
| PA-C3 | `src/lib/security/rate-limit.ts` (`InMemoryStore`)                       | **Rate limiter is in-memory**, not shared across serverless instances (DEBT-010).                                        | Security: login/signup/reset brute-force protection is bypassable in production.                                                                                                   |
| PA-C4 | Loop provisioning (DB + seed + profile)                                  | **Loop unverified end-to-end** — no environment has run login → lesson → quiz → review → dashboard against real data.    | Product: cannot confirm the core experience works for a real account.                                                                                                              |

## 3. Findings — HIGH (needed for a credible beta)

| ID    | File / Module                                                                                                                     | Finding                                                                                                                                                       | Impact                                                                                                                                          |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| PA-H1 | `src/modules/daily-loop/infrastructure/in-memory-session-repository.ts`                                                           | **Learning sessions are in-memory** (DEBT-016).                                                                                                               | Session/Dashboard: Recent Activity is always empty; time/score/completion lost on restart or across instances.                                  |
| PA-H2 | `src/modules/learning/infrastructure/mission/{in-memory-mission-repository,in-memory-user-progress}.ts` + `content/**` not seeded | **Mission Engine storage is in-memory and the Mission Library (40 missions) is not seeded into the DB.**                                                      | Mission: mission progress not persisted; the mission flow's scoring/review are session-scoped only (Task 05); missions can't feed the real SRS. |
| PA-H3 | `src/modules/daily-loop/infrastructure/in-memory-lesson-plan-repository.ts`                                                       | **Lesson plans saved in-memory** (Task 02).                                                                                                                   | Daily Lesson: generated plans are ephemeral; no history/analytics of what was planned.                                                          |
| PA-H4 | `src/modules/ai/infrastructure/repositories.ts` (`InMemoryPromptTemplateRepository`, `InMemoryGenerationHistoryRepository`)       | **AI prompt templates + generation history in-memory** (DEBT-014).                                                                                            | AI: prompts can't be edited without redeploy; generation history is ephemeral.                                                                  |
| PA-H5 | `src/modules/ai/**` + `src/lib/env.ts` (`isAiConfigured`)                                                                         | **AI has no API keys** → all AI (explanation, coach, example, feedback) runs on deterministic fallback; **unverified against live provider APIs** (DEBT-021). | AI/Daily Lesson/Dashboard: no real AI value yet; coach card is mock (`src/lib/dashboard/coach-message.ts`).                                     |
| PA-H6 | `src/modules/learning/application/services/progress-service.ts` (`recordProgress` → 501) · `src/app/api/v1/progress/route.ts`     | **Learning-engine progress recording is 501 NotImplemented** (DEBT-009).                                                                                      | Progress: no server-side progress persistence via the learning engine.                                                                          |
| PA-H7 | `next.config.mjs` · `src/lib/security/request-context.ts`                                                                         | **No security headers** (CSP/HSTS/…); **spoofable `x-forwarded-for`** for rate-limit/audit (DEBT-024/025).                                                    | Security hardening for production.                                                                                                              |
| PA-H8 | Deployment (`.github/workflows/ci.yml`, `railway.json`+`vercel.json`)                                                             | No CD/`migrate deploy` step; **two hosting targets**; no error monitoring; no Postgres/integration CI (DEBT-012/031).                                         | Ops: can't safely deploy + migrate; no observability.                                                                                           |

## 4. Findings — MEDIUM / LOW

### Medium

| ID    | File / Module                                                                                    | Finding                                                                                                                                  | Impact                                                                              |
| ----- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| PA-M1 | `prisma/seed.ts`                                                                                 | Seeds only RBAC + CEFR-A1 + 100 A1 words; **learning-engine (courses/units/lessons) and Mission Library are NOT seeded**.                | Learning-engine read endpoints return empty; missions absent from DB (bug BUG-005). |
| PA-M2 | `src/app/(dashboard)/learn/{page,units/[unitId],lessons/[lessonId],lessons/[lessonId]/play}.tsx` | Legacy learn explorer/unit/lesson pages are **placeholders** (`learn-placeholder.tsx`).                                                  | Dead-end routes if surfaced in beta; keep out of beta nav.                          |
| PA-M3 | `src/app/(admin)/admin/{generator,generation-history}/page.tsx`                                  | Admin AI tool pages are **placeholders**.                                                                                                | Admin AI tooling not functional.                                                    |
| PA-M4 | `src/modules/ai/application/services/prompt-version-service.ts` (`createDraft`/`publish` → 501)  | Prompt authoring flow **NotImplemented**.                                                                                                | Can't manage prompt versions at runtime.                                            |
| PA-M5 | `src/modules/ai/**`                                                                              | No AI **output moderation / per-user quota / eval harness** (DEBT-018); no generation caching; `cost_micro_usd` always 0 (DEBT-019/020). | Cost/safety before exposing generation.                                             |
| PA-M6 | `src/modules/daily-loop/application/services/daily-lesson-service.ts`                            | When AI **is** configured, quiz explanations are generated **in `/learn/today` SSR** (PERF-01).                                          | Latency risk once AI is enabled.                                                    |

### Low

| ID    | File / Module                                              | Finding                                                                                   | Impact                     |
| ----- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------- |
| PA-L1 | `src/app/page.tsx`                                         | Landing page self-described placeholder (Sprint-1).                                       | Marketing polish.          |
| PA-L2 | `src/modules/ai/infrastructure/stub-llm-adapter.ts`        | **Dead code** — only referenced by a test (DEBT-029).                                     | Cleanup.                   |
| PA-L3 | `src/modules/learning/domain/mission/activity-builders.ts` | Listening/Speaking are **intentional placeholders** (`assertActivityImplemented` throws). | Expected; future skills.   |
| PA-L4 | `package.json` (`next lint`, prisma seed config)           | Deprecated tooling (DEBT-002/003).                                                        | Before Next 16 / Prisma 7. |

## 5. Beta Readiness — **58 / 100**

**Verdict: not yet beta-launchable; ~3–4 focused engineer-weeks of _wiring_ (no new features) away.**

Weighted breakdown:

| Dimension                      | Score   | Why                                                                                                           |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------- |
| Code & architecture            | 88%     | Clean hexagonal modules, typed, tested (127), green build; strong seams.                                      |
| Content                        | 85%     | 100 A1 words + 40-mission library authored & validated; not yet in the DB.                                    |
| **Persistence / data reality** | **30%** | Sessions, lesson plans, mission engine, AI templates/history all in-memory; library unseeded; **no live DB**. |
| Authentication readiness       | 45%     | Auth flows real, but no DB + no profile/role sync → new users unusable.                                       |
| Security hardening             | 50%     | Env-only secrets + IDOR-safe + CSRF good; in-memory rate limit, no headers, spoofable IP.                     |
| AI readiness                   | 45%     | Real provider chain, but no keys → fallback; no moderation/quota; unverified live.                            |
| Ops / deployment               | 45%     | Solid CI + Docker + health probe; no CD/migrate step, dual hosts, no monitoring.                              |

**Overall ≈ 58%.**

**Why 58 and not higher:** the _build-time_ quality is excellent (~85%), but _run-time production
readiness_ is low — the app cannot currently be used by a real person because there is **no
database, no profile sync, and core state lives in memory**. These four Critical items gate
everything.

**Why 58 and not lower:** none of the gaps are missing features or redesigns. Every gap is a
well-understood provisioning/wiring task with the code already in place behind clean ports (swap an
in-memory repo for a Prisma one; run a migration; add a key; add a trigger). The path to beta is
short and low-risk.

**Gate to a private beta:** clear the four Criticals (PA-C1..C4) + High persistence items
(PA-H1/H2/H5) → readiness jumps to ~85%. See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).
