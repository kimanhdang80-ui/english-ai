# NEXT_TASK.md — English AI

> **Task 01 (Learning Dashboard redesign): ✅ Done** — `reports/task-01-dashboard.md` + `DASHBOARD_BEFORE_AFTER.md`.
> **Task 02 (Daily Lesson Generator): ✅ Done** — `reports/task-02-daily-generator.md` +
> `docs/DAILY_LEARNING_ALGORITHM.md`.
> **Task 03 (Mission Engine): ✅ Done** — `reports/task-03-mission-engine.md` + `docs/MISSION_ENGINE.md`.
> **Task 04 (Mission Library): ✅ Done** — `reports/task-04-mission-library.md` + `docs/MISSION_LIBRARY.md`.
> **Task 05 (Complete Mission Flow): ✅ Done** — `reports/task-05-complete-mission-flow.md` +
> `docs/MISSION_FLOW.md`. The full mission flow is playable at `/learn/mission/[id]` over the library;
> scoring + review-queue are session-scoped. To make them durable (persist sessions, feed the real SRS
> and dashboard Recent Activity), the library must be **seeded into the DB** and the flow wired to the
> Mission Engine — the Learning Model V2 migration: **P2 persist `missions` + seed**, **P4 cutover**.
> Session/loop persistence also needs Sprint 8.2.
>
> **Release-candidate wiring:** **RC-01 (DB wiring): ✅ audited** — `DATABASE_READY_REPORT.md`
> (migrations + vocab/RBAC seed ready; blocked only by no live DB; fallbacks marked). **RC-02 (Auth
> production): ✅ Done** — `AUTH_READY_REPORT.md` + ADR-0004 (`handle_new_user`/`handle_user_delete`
> triggers). **RC-03 (Persistence production): ✅ Done** — `PERSISTENCE_READY_REPORT.md` + ADR-0005
> (migration `20260702010000_persistence_stores`, 8 tables): all in-memory runtime repos retired for
> Prisma; Mission Library + prompt templates read from the DB and seeded. **RC-04 (AI production):
> ✅ Done** — `AI_PRODUCTION_READY_REPORT.md` + `AI_HEALTHCHECK.md` + `AI_COST_GUIDE.md`: circuit
> breaker, per-call cost, streaming (SSE), `GET /api/health/ai`, `/admin/ai-metrics` (no DB
> migration). **Remaining Critical to
> launch a beta = provisioning + the session/progress writer:** stand up Postgres/Supabase, then
> `prisma migrate deploy` (incl. `20260702000000_auth_user_sync` +
> `20260702010000_persistence_stores`) then `prisma:seed`; wire the lesson/mission-completion →
> `recordSession`/progress hook (Sprint 8.2); set AI keys + run the AI deploy matrix
> (`AI_PRODUCTION_READY_REPORT.md` §5); wire a Redis rate-limit store; and run the E2E + auth +
> persistence matrices. See `PRODUCTION_CHECKLIST.md` (C1/C3/C4).
>
> Exactly what to build next. Currently: **Sprint 8.2 — Persist the loop + provision DB**.
> Sprint 8.1 shipped the first complete learn loop (composition only) — see
> [reports/sprint-08.1-report.md](../reports/sprint-08.1-report.md) and
> [reports/sprint-08.1/](../reports/sprint-08.1/). Run **per [PROJECT_OS.md](./PROJECT_OS.md)**;
> this sprint triggers the **DB gate** (§4). Track MVP readiness in
> [MVP_CHECKLIST.md](./MVP_CHECKLIST.md).

---

## Sprint 8.2 — Provision the database & persist the loop

### Goal

Make the loop **real and durable**: run the app on Postgres, and persist learning sessions
so streak/history survive across requests. This is the single recurring blocker (no DB in
the build environment) and the last thing between us and a private beta of vocabulary.

### ⚠️ Gate first (PROJECT_OS §4) — for the new table

**DB gate** (ADR + Impact + Migration + Rollback) for `learning_sessions`
(user_id, started_at, completed_at, duration_ms, words_studied, quiz_score, quiz_total).
No schema until this is produced.

### Scope (Deliverables)

1. **Provision & apply** — Postgres/Supabase; `prisma migrate deploy` + `npm run prisma:seed`
   (roles/permissions + CEFR A1 + 100 words). (Closes DEBT-004.)
2. **`learning_sessions` table** (after the gate) — swap `InMemorySessionRepository` for a
   Prisma repo; `LearningHistoryService.recordSession` persists; add a session-record
   endpoint or Server Action called at lesson completion. (Closes DEBT-016.)
3. **Verify the loop E2E** — login → today's lesson (add) → quiz (results/explanations) →
   review (SRS) → dashboard reflects progress/streak/queue.
4. **Integration tests** — repositories + activity/streak derivation against a Postgres
   service in CI. (Closes DEBT-012.)

### Explicitly OUT of scope

Personalized word selection (DEBT-017), other skills. (AI provider integration is **done** —
Milestone 1; remaining AI work is persistence of `prompt_templates`/jobs + an eval harness.)

### Definition of Done

- [ ] DB gate artifacts produced; migration + seed apply on a clean DB.
- [ ] Sessions persist; streak/history correct across requests.
- [ ] Full loop verified manually; integration tests green in CI with Postgres.
- [ ] Build, lint, typecheck, tests, format green; 6 governance reports generated.

### Parallel open tracks

- ~~**Sprint 7.2** — AI provider integration~~ ✅ **Done (Milestone 1)** — Claude/OpenAI
  behind `LlmPort`; `ai_usage_logs` added. Follow-ups: `prompt_templates`/`ai_generation_jobs`
  persistence (DEBT-014), eval harness/moderation (DEBT-018), cost pricing (DEBT-019).
- **Sprint 2.2** — Supabase→`profiles` sync. **Sprint 3.2** — learning-engine authoring.
