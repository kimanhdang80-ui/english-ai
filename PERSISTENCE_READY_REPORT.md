# PERSISTENCE_READY_REPORT.md — RC-03 Persistence Production Ready

> Role: Principal Backend Engineer. Goal: remove every in-memory repository from the production
> runtime; back Session / Mission / Mission Progress / Lesson Plan / AI History / Prompt Template /
> Generation History with Prisma; read the Mission Library from the database (JSON = seed only).
> No new feature, no UI change, no UX change. Read: [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md),
> [AUTH_READY_REPORT.md](./AUTH_READY_REPORT.md), [DATABASE_READY_REPORT.md](./DATABASE_READY_REPORT.md),
> [PROJECT_STATE.md](./docs/PROJECT_STATE.md). Decision: [docs/adr/ADR-0005.md](./docs/adr/ADR-0005.md).
> Date: 2026-07-02.

---

## 0. Summary

Every in-memory runtime repository is **gone from the composition roots**. Session, lesson-plan,
mission, mission-progress, prompt-template and generation-history are now Prisma-backed, and the
Mission Library is read from the **database** (`content_tracks` / `content_missions`) — the authored
JSON is now used **only** by the seed. One additive migration (`20260702010000_persistence_stores`,
8 tables) delivers the stores; ports are unchanged, so services and UI are untouched.

This environment has **no live Supabase/Postgres** (see DATABASE_READY_REPORT), so the runtime
"restart the server" checks can't be executed here. Everything that can be verified offline is:
schema validates, migration generated drift-free via `prisma migrate diff`, client generated,
typecheck/lint/test/build green, and a new offline invariants test locks the migration + schema +
the content→engine mapper.

## 1. Repository audit — before → after

| Store                  | Before (in-memory)                    | After (Prisma)                                      | Table                                  |
| ---------------------- | ------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| **Session**            | `InMemorySessionRepository`           | `PrismaSessionRepository`                           | `learning_sessions`                    |
| **Lesson Plan**        | `InMemoryLessonPlanRepository`        | `PrismaLessonPlanRepository`                        | `lesson_plans`                         |
| **Mission**            | `InMemoryMissionRepository` (empty)   | `PrismaMissionRepository` (reads library, mapped)   | `content_missions`                     |
| **Mission Progress**   | `InMemoryUserProgressRepository`      | `PrismaUserProgressRepository`                      | `mission_progress`                     |
| **Prompt Template**    | `InMemoryPromptTemplateRepository`    | `PrismaPromptTemplateRepository`                    | `prompt_templates` / `prompt_versions` |
| **Generation History** | `InMemoryGenerationHistoryRepository` | `PrismaGenerationHistoryRepository`                 | `ai_generation_jobs`                   |
| **Mission Library**    | filesystem JSON (runtime `fs.read`)   | DB read (`mission-loader.ts` → Prisma), Zod-checked | `content_tracks` / `content_missions`  |
| **AI Usage Log**       | already Prisma (ADR-0003)             | unchanged (Noop only when no DB — intentional)      | `ai_usage_logs`                        |

**Grep proof:** no `InMemory*` remains in any `infrastructure/container.ts`. The in-memory classes
that survive are **test-only fakes** (annotated as such) used by unit tests;
`InMemorySessionRepository` had no such use and was **deleted** as dead code.

## 2. What was built (no feature / no UI / no UX)

- **Migration** `prisma/migrations/20260702010000_persistence_stores/migration.sql` — 8 additive
  tables + indexes + cascade FKs to `profiles`. Generated offline with `prisma migrate diff`
  (drift-free). No existing table altered.
- **Schema** — 8 Prisma models + back-relations on `Profile` (`learningSessions`, `lessonPlan`,
  `missionProgress`). 39 → **47** models.
- **Prisma repositories** (7) — daily-loop `prisma-session-repository.ts`,
  `prisma-lesson-plan-repository.ts`; learning/mission `prisma-mission-repository.ts`,
  `prisma-user-progress-repository.ts`, `mission-content-mapper.ts`; ai
  `prisma-prompt-template-repository.ts`, `prisma-generation-history-repository.ts`.
- **Mission Library from DB** — `src/content/mission-loader.ts` rewritten to async Prisma reads
  (same function names, Zod-validated); the two consuming pages `await` it. Seed loader
  `prisma/data/mission-library.ts` (node fs) reads + validates the JSON for seeding only.
- **Seed** — `prisma/seed.ts` now also seeds the Mission Library (4 tracks × 10 missions) and the
  prompt templates (from the code registry). Idempotent (upserts).
- **Rendering** — `(admin)/layout.tsx` marked `force-dynamic` (admin now reads live DB data).
- **ADR-0005** (DB gate): context, decision, impact, migration, backfill (none needed), rollback,
  alternatives.
- **Offline test** `src/lib/db/persistence-invariants.test.ts` (20 tests): migration creates all 8
  tables + cascade FKs + is additive-only; schema declares all 8 models; the content→engine mapper
  is faithful (5 MC / 3 fill / 6 match questions, correct answer key) and pure.

**No changes** to any port, service, domain type, or the mission library content — only wiring.

## 3. Gates

| Gate                     | Result                                                |
| ------------------------ | ----------------------------------------------------- |
| `npm run typecheck`      | ✅ pass                                               |
| `npm run lint`           | ✅ no warnings                                        |
| `npm run test`           | ✅ **153** passed (+20 persistence invariants/mapper) |
| `npm run build`          | ✅ compiled + all pages (admin now dynamic)           |
| `npm run format:check`   | ✅ all files Prettier-clean                           |
| `prisma validate`        | ✅ valid                                              |
| `prisma generate`        | ✅ client generated                                   |
| `prisma migrate` (apply) | ⛔ deploy-time — no DB in this environment            |
| `prisma:seed`            | ⛔ deploy-time — compiles; needs a live DB to run     |

## 4. Persistence testing matrix (deploy-time — needs live Postgres)

After `prisma migrate deploy` + `npm run prisma:seed`:

| Test                | Steps                                                   | Expected                                                       |
| ------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| **Mission Library** | Query `content_tracks`/`content_missions`               | 4 tracks, 40 missions; `/learn/missions` renders from the DB   |
| **Prompt Template** | Open `/admin/prompts`                                   | Templates + versions served from `prompt_templates`            |
| **Lesson Plan**     | Visit `/learn/today`, restart server, revisit           | Plan persisted (`lesson_plans` row per user), survives restart |
| **Session**         | Record a session (Sprint 8.2 hook), restart, dashboard  | Session in `learning_sessions`, still listed after restart     |
| **Progress**        | Record mission progress, restart                        | `mission_progress` row persists; completed missions stable     |
| **Generation Hist** | Run the generator, restart, `/admin/generation-history` | Record in `ai_generation_jobs`, survives restart               |

## 5. Scope notes & honest gaps

- **Session & mission-progress writers.** The repositories persist whatever is appended, but the
  **call-sites** that record a completed session / mission progress are **not** wired at runtime yet
  (the mission flow is client-session-scoped, Task 05). Wiring them at lesson/mission completion is
  the documented **Sprint 8.2** step (adding a writer touches behavior, out of RC-03's
  "no new feature" boundary). Until then these two stores are read-ready but populated only by tests.
  Lesson-plan and generation-history **do** have runtime writers today (`/learn/today` planning; the
  generator), so they persist end-to-end.
- **Document store, not full normalization.** `content_missions` stores the validated `MissionContent`
  as JSON (indexed scalars for querying). This is the minimal, reversible persistence for RC-03; the
  fully-normalized V2 mission tree is a later phase (ADR-0005 §Alternatives / Future Review).
- **Retained fallback (intentional, not in-memory):** the AI usage-log sink degrades to a no-op when
  no DB is configured so AI still runs with logging off (Milestone-1 decision). It is not an
  in-memory repository and is left as-is.
- **`MissionRepository.save`** throws `NotImplementedError` in the Prisma repo — missions are authored
  content written by the seed, not through the engine at runtime (honest, explicit).

## 6. Verdict

**The production runtime no longer contains any in-memory repository.** Session, lesson-plan,
mission, mission-progress, prompt-template and generation-history are Prisma-backed; the Mission
Library reads from the database with JSON demoted to seed input. The one additive migration is
drift-free and reversible, ports/UI/UX are unchanged, and all offline gates are green. The remaining
work is **operational** (provision Postgres, `migrate deploy` + `seed`, run §4) plus the Sprint 8.2
session/progress **writer** hookup. Persistence moves from 🔴 (in-memory) to 🟢 pending provisioning.
