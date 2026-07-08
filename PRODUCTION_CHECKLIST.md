# PRODUCTION_CHECKLIST.md — Road to Beta

> Everything required to take English AI from "code-complete + green" to a **private beta**.
> Derived from [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md). Grouped Critical → High → Medium → Low.
> Each item names the swap/wiring (the code already exists behind ports — this is provisioning, not
> feature work). Est: S < ½d · M ~1–2d · L ~3–5d.

**Current beta readiness: ~58%.** Clearing Critical + High-persistence → ~85% (private-beta ready).

---

## 🔴 CRITICAL — must all be done before any beta

- [ ] **C1 · Provision Postgres/Supabase + apply schema** — create the instance; run
      `prisma migrate deploy` (incl. `ai_usage_logs`) + `npm run prisma:seed` (RBAC + CEFR-A1 +
      100 words). Set `DATABASE_URL`/`DIRECT_URL`. (PA-C1 / DEBT-004) — **M**
- [ ] **C2 · Supabase→`profiles`/role sync** — add an `AFTER INSERT ON auth.users` trigger
      (SECURITY DEFINER) that creates the profile + assigns default `student` role, OR do it
      transactionally in `/auth/callback`. Verify a fresh sign-up lands with a profile + role.
      (PA-C2 / DEBT-008) — **M**
- [ ] **C3 · Redis-backed rate limiter** — provision Upstash/Redis; inject via the existing
      `setRateLimitStore()` seam before production. (PA-C3 / DEBT-010) — **S**
- [ ] **C4 · Verify the loop E2E on real data** — login → today's lesson (add words) → quiz
      (results/explanations) → review (SRS) → dashboard reflects progress/streak/queue. (PA-C4) — **M**
- [ ] **C5 · Set AI keys (or accept fallback for beta)** — add `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`
      (or explicitly decide beta ships on the deterministic fallback). If enabled, smoke-test one
      real call per capability. (PA-H5) — **S**

## 🟠 HIGH — required for a credible, durable beta

- [ ] **H1 · Persist learning sessions** — DB gate for `learning_sessions`; swap
      `InMemorySessionRepository` → Prisma repo; call it at lesson completion so Recent Activity /
      history survive. (PA-H1 / DEBT-016) — **M**
- [ ] **H2 · Seed the Mission Library into the DB + persist mission progress** — DB gate for
      `missions`/`mission_activities` (V2 migration P2); seed the 40 missions via the content loader;
      swap `InMemoryMissionRepository`/`InMemoryUserProgress` → Prisma. (PA-H2 / DEBT-014) — **L**
- [ ] **H3 · Persist lesson plans** — small `lesson_plans` table (DB gate); swap
      `InMemoryLessonPlanRepository` → Prisma. (PA-H3) — **M**
- [ ] **H4 · Persist AI prompt templates + generation history** — `prompt_templates` /
      `generation_history` tables; swap the in-memory AI repos. (PA-H4 / DEBT-014) — **M**
- [ ] **H5 · Security headers + trusted client IP** — add CSP/HSTS/X-Frame-Options/
      X-Content-Type-Options/Referrer-Policy (`next.config`/middleware); resolve IP from the
      platform's real-IP header. (PA-H7 / DEBT-024/025) — **S**
- [ ] **H6 · Deployment pipeline** — pick ONE host (Railway _or_ Vercel); add CD that runs
      `migrate deploy`; add a Postgres CI job + repository integration tests; add error monitoring
      (Sentry). (PA-H8 / DEBT-012/031) — **M**
- [ ] **H7 · Wire the Mission Flow review-queue to the real SRS** — after H2, connect the mission
      flow's Need-Review words to `user_vocabulary` so review persists (currently session-scoped).
      (Task 05) — **M**

## 🟡 MEDIUM — quality & completeness (can trail early beta)

- [ ] **M1 · Implement learning-engine `ProgressService.recordProgress`** (replace 501) once a
      progress table exists. (PA-H6 / DEBT-009) — **M**
- [ ] **M2 · AI abuse controls before exposing generation** — per-user daily quota (via
      `ai_usage_logs`) + output moderation + prompt-injection delimiting; add an `ai.generate`
      permission. (PA-M5 / DEBT-015/018) — **M**
- [ ] **M3 · Get AI generation out of `/learn/today` SSR** — render fallback immediately, hydrate AI
      text client-side; cap timeout for that feature. (PA-M6 / PERF-01) — **M**
- [ ] **M4 · AI cost + caching** — populate `cost_micro_usd`; cache identical generations
      (`cache_hit`). (DEBT-019/020) — **M**
- [ ] **M5 · Gate placeholder routes out of beta** — hide/redirect legacy learn explorer/unit/lesson + admin AI tool placeholders; or finish them. (PA-M2/M3) — **S**
- [ ] **M6 · Email deliverability** (verification/reset) configured on the real Supabase project. — **S**
- [ ] **M7 · Accessibility pass** (WCAG 2.2 AA): remaining field-error association, mobile nav,
      reduced-motion. (reports/beta-readiness §13) — **M**

## 🟢 LOW — polish / housekeeping

- [ ] **L1 · Remove dead `StubLlmAdapter`** (repoint its test to `UnconfiguredProvider`). (PA-L2) — **S**
- [ ] **L2 · Landing page** real content (replace Sprint-1 placeholder). (PA-L1) — **S**
- [ ] **L3 · Tooling deprecations** — migrate off `next lint` (ESLint flat config) + Prisma seed
      config (`prisma.config.ts`). (PA-L4 / DEBT-002/003) — **S**
- [ ] **L4 · Implement Listening/Speaking** activity builders + content when scheduled. (PA-L3) — **L**
- [ ] **L5 · Timezone-aware streak** (currently UTC). (reports/beta-readiness RISK-03) — **S**

---

## Definition of "Beta ready"

- [ ] All Critical (C1–C5) done; loop verified E2E on a provisioned DB.
- [ ] High persistence (H1–H4) done so no core state is lost across requests/instances.
- [ ] Security headers + Redis rate limit live; error monitoring on.
- [ ] One hosting target with automated `migrate deploy`.
- [ ] Placeholder/dead routes hidden from beta users.
- [ ] Green gates hold (typecheck · lint · test · build) + a manual QA pass of the full journey.

**Estimated effort to private beta:** ~3–4 engineer-weeks (Critical + High), excluding
provider/DB provisioning lead time. No new features or rewrites required.
