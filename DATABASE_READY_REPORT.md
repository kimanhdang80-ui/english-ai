# DATABASE_READY_REPORT.md — RC-01 Production Database Wiring

> Goal: move the whole project onto a real database. No new feature, no UI/UX change.
> **Hard blocker: this environment has no reachable database** (no `.env`, `prisma migrate status`
> → `P1000` auth/connection failure). So `migrate deploy`, `prisma:seed`, and runtime DB
> verification **cannot be executed here** — they are deploy-time actions. Everything doable
> offline was done and is green; every DB-absent fallback is inventoried and **marked** (per
> "nếu chưa thể xóa, đánh dấu rõ"). Companion: [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).
> Date: 2026-07-02.

---

## 0. Status at a glance

| Step (RC-01)                                                    | Result                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1. Prisma migrations                                            | ✅ **Ready** (valid; schema ⇄ migrations drift-free) · ❌ not applied (no DB)                    |
| 2. Seed (RBAC + CEFR-A1 + vocabulary)                           | ✅ **Ready** (compiles + runs to the DB-connect point) · ❌ not run (no DB)                      |
| 3. Seed Mission Library                                         | ⛔ **Blocked** — no `missions` tables in the schema + no DB (see §3)                             |
| 4. Seed Vocabulary                                              | ✅ Script ready (100 A1 words) · ❌ not run (no DB)                                              |
| 5. Verify DB reads (Mission/Vocab/Review/Progress/Daily Lesson) | 🟡 **Static-verified** (code reads Prisma where wired); runtime unverifiable without DB (see §4) |
| 6. Remove DB-absent fallbacks                                   | 🟡 **Kept + marked** — removing now breaks the DB-less build/gates (see §5)                      |
| Gates: build · typecheck · lint · migration · seed              | ✅ build/typecheck/lint/validate green; migrate/seed blocked at connection                       |

## 1. Migrations (offline-verified)

- `prisma validate` → **valid** 🚀 (with a placeholder `DATABASE_URL`).
- `prisma generate` → client generated (runs in `npm run build`).
- **Drift check:** schema emits **40 `CREATE TABLE`** (`migrate diff --from-empty`) and the two
  migrations contain **40 `CREATE TABLE`** total → schema and migration history agree.
  - `prisma/migrations/20260701000000_init` (auth + learning-engine + vocabulary)
  - `prisma/migrations/20260701010000_ai_usage_logs`
- `prisma migrate status` → **cannot run** (P1000, no server). Applying is a deploy action:
  `prisma migrate deploy`.

## 2. Seed (offline-verified)

- `prisma/seed.ts` **compiles and executes** up to the first DB query (fails at `seed.ts:81` on
  connection — proof it's ready, blocked only by the absent DB).
- Scope (from `prisma/seed.ts`): **permissions/roles/role_permissions** (RBAC) + **CEFR A1** +
  **100 A1 vocabulary words** (`prisma/data/a1-vocabulary.ts`) with meanings/examples.
- Run at deploy: `npm run prisma:seed`.

## 3. Mission Library seeding — ⛔ BLOCKED (marked)

The 40-mission library (`content/tracks/*`, `content/missions/**`, validated by
`src/content/mission-library.test.ts`) **cannot be seeded yet** because:

1. **No mission tables exist in `prisma/schema.prisma`.** By design (Task 03) the Mission Engine
   uses in-memory repositories; the durable `missions` / `mission_activities` tables are the V2
   migration's **P2** step (`docs/migration/DATABASE_MIGRATION_PLAN.md`) — **not yet authored/applied**.
2. **No live DB** to seed into.

**This is a DB-gate item, not a quick wiring step.** Doing it blindly (no DB to verify) would risk
shipping an untested schema + seed. Prerequisites, in order (owner: DB-provisioning):

- [ ] Author + apply the V2 mission tables migration (ADR + impact + migration + rollback, PROJECT_OS §4).
- [ ] Swap the Mission Engine's in-memory repos for Prisma repos (ports already exist:
      `MissionRepository`, `UserProgressPort`).
- [ ] Add a `prisma/seed-missions.ts` that reads `content/` via the existing loader/schema and upserts
      tracks/missions/activities/exercises/questions.
- [ ] (Optional) fold the library's 320 vocabulary words into `vocabularies` so they feed the real SRS.

Until then the mission flow (`/learn/mission/[id]`, Task 05) reads the library JSON at runtime and is
**session-scoped** — correct, but not DB-backed.

## 4. DB-read verification per module (static)

Traced each module's data source in code (runtime confirmation needs a live DB):

| Module           | Reads from                                                                                                                                   | Real DB?                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Vocabulary**   | `PrismaVocabularyRepository` / `PrismaUserVocabularyRepository` (`vocabulary/infrastructure/repositories.ts`)                                | ✅ Prisma                        |
| **Review**       | `ReviewQueueService` → `source.studySet` → `vocabulary.learner.getStudySet` (Prisma)                                                         | ✅ Prisma                        |
| **Progress**     | Dashboard `vocabulary.learner.getStats` (Prisma) ✅ · learning-engine `ProgressService.recordProgress` = **501** ⚠                           | 🟡 read yes / engine-write no    |
| **Daily Lesson** | planner: `PrismaLearnerProfileRepository` + review snapshot (Prisma) + corpus `getQuizItems` (Prisma) ✅ · **lesson plan saved in-memory** ⚠ | 🟡 reads DB / plan not persisted |
| **Mission**      | `InMemoryMissionRepository` + `InMemoryUserProgressRepository` + library JSON                                                                | ❌ in-memory / file              |
| _(Streak)_       | `PrismaReviewActivityRepository` (from `review_history`)                                                                                     | ✅ Prisma                        |

**Conclusion:** Vocabulary, Review, Progress (read), Daily Lesson (read), and Streak are wired to
Prisma and will read from the DB once it's provisioned + seeded. **Mission** is the one module still
on in-memory/file storage (blocked by §3).

## 5. DB-absent fallback inventory (kept + marked)

RC-01 asks to remove no-DB fallbacks. **They are intentionally kept in this pass**, because the
build, CI, and all gates run **without** a database/Supabase/AI provider in this environment —
removing them would make `npm run build` and every page crash (static generation calls
`requireUser` → Supabase) and fail the gates RC-01 also requires. Each is marked below with its
**removal condition** (do it at go-live, once the service is provisioned).

| #   | Fallback                                                                                 | File:line                                                                                                | Trigger                 | Remove when                                            |
| --- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ |
| F1  | Supabase not configured → `getCurrentUser` returns null                                  | `src/lib/auth/session.ts:25`                                                                             | `!isSupabaseConfigured` | Supabase project live (keys set)                       |
| F2  | Supabase not configured → middleware/callback/auth-layout guards                         | `src/lib/supabase/middleware.ts:22`, `src/app/auth/callback/route.ts:23`, `src/app/(auth)/layout.tsx:27` | `!isSupabaseConfigured` | Supabase live                                          |
| F3  | DB not configured → **audit log is skipped**                                             | `src/lib/auth/audit.ts:21`                                                                               | `!isDatabaseConfigured` | DB live (`DATABASE_URL` real)                          |
| F4  | DB not configured → **NoopAiUsageLogRepository** instead of Prisma                       | `src/modules/ai/infrastructure/container.ts:55`                                                          | `!isDatabaseConfigured` | DB live                                                |
| F5  | AI not configured → **MockExplanationAdapter** instead of AI                             | `src/modules/daily-loop/infrastructure/container.ts:29`                                                  | `!isAiConfigured`       | AI keys set (or keep as graceful fallback)             |
| F6  | AI not configured → provider chain returns **UnconfiguredProvider** → deterministic text | `src/modules/ai/infrastructure/providers/provider-factory.ts:63/69`                                      | no API key              | AI keys set (recommend KEEP as graceful fallback)      |
| F7  | In-memory **session** store                                                              | `src/modules/daily-loop/infrastructure/container.ts:33`                                                  | always (skeleton)       | `learning_sessions` table + Prisma repo (CHECKLIST H1) |
| F8  | In-memory **lesson-plan** store                                                          | `src/modules/daily-loop/infrastructure/container.ts:39`                                                  | always                  | `lesson_plans` table + Prisma repo (H3)                |
| F9  | In-memory **mission repo + progress**                                                    | `src/modules/learning/infrastructure/mission/container.ts:15-16`                                         | always                  | mission tables + Prisma repos (H2, §3)                 |
| F10 | In-memory **AI templates + generation history**                                          | `src/modules/ai/infrastructure/container.ts:37/40`                                                       | always                  | `prompt_templates`/`generation_history` tables (H4)    |
| F11 | In-memory **rate-limit** store                                                           | `src/lib/security/rate-limit.ts`                                                                         | always                  | Redis store via `setRateLimitStore()` (C3)             |
| F12 | Dashboard **AI Coach mock**                                                              | `src/lib/dashboard/coach-message.ts`                                                                     | always                  | wire to `AiTextService` (real AI)                      |

> **Recommendation:** F5/F6 (AI graceful fallback) should **stay** even in production — they keep the
> loop working when AI is down. F1–F4 become inert automatically once services are configured (the
> flags flip to true), so they need no code removal — only real env values. F7–F12 require the
> persistence work in [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) (H1–H4, C3).

## 6. Gate results

| Gate                    | Result                                     |
| ----------------------- | ------------------------------------------ |
| `npm run typecheck`     | ✅ pass                                    |
| `npm run lint`          | ✅ no warnings                             |
| `npm run test`          | ✅ 127 passed                              |
| `npm run build`         | ✅ compiled + 26/26 pages                  |
| `prisma validate`       | ✅ valid                                   |
| `prisma generate`       | ✅ client generated                        |
| `prisma migrate status` | ⛔ blocked (P1000 — no DB)                 |
| `npm run prisma:seed`   | ⛔ blocked (compiles; fails at DB connect) |

No code was changed in RC-01, so the code gates match Task 05's green baseline.

## 7. Go-live runbook (deploy-time, once a DB + Supabase exist)

```
1. Provision Postgres/Supabase; set DATABASE_URL (+ DIRECT_URL) and Supabase keys.
2. npx prisma migrate deploy            # applies init + ai_usage_logs
3. npm run prisma:seed                  # RBAC + CEFR-A1 + 100 vocabulary words
4. Add the Supabase→profiles/role trigger (CHECKLIST C2) and verify a fresh sign-up.
5. (V2) author+apply mission tables migration → swap Mission Engine to Prisma → seed the library (§3).
6. Set AI keys (optional) + Redis rate-limit store (C3).
7. Smoke-test: login → /learn/today (add words) → quiz → /review → dashboard reflects data.
```

## 8. Readiness statement

**Database wiring is code-ready but not activated.** Migrations and the vocabulary/RBAC seed are
verified-ready and will apply cleanly on a real Postgres; five of six audited modules already read
through Prisma. The remaining work is **provisioning + two persistence steps** (Supabase→profiles
sync, and the V2 mission tables to seed the library) — no features, no UI/UX changes. Because this
environment has **no database**, RC-01's execution steps (apply, seed, runtime-verify) and fallback
removal are **deferred to deploy and clearly marked** here rather than faked.
