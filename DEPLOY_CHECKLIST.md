# DEPLOY_CHECKLIST.md — English AI → Vercel Production

> Step-by-step production deploy checklist. Full narrative + rationale in
> [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md). Architecture in
> [DEPLOYMENT_AUDIT.md](./DEPLOYMENT_AUDIT.md). Work top-to-bottom; do not skip the release step.

---

## A. Pre-flight (local, once)

- [ ] Node **20** (`.nvmrc`), `npm ci` installs cleanly.
- [ ] `npm run typecheck` — passes.
- [ ] `npm run lint` — no warnings.
- [ ] `npm run test` — passes (**175** tests).
- [ ] `DATABASE_URL` + `DIRECT_URL` set (placeholders OK) → `npm run build` — **passes**
      (only warning is the non-blocking Prisma 6→7 `package.json#prisma` deprecation).
- [ ] `npx prisma validate` — schema valid (now declares `directUrl`).

## B. Supabase (database + auth)

- [ ] Create the Supabase project (Postgres 16).
- [ ] Copy **pooled** connection string (`:6543`, add `?pgbouncer=true&connection_limit=1`) → this is
      **`DATABASE_URL`**.
- [ ] Copy **direct** connection string (`:5432`) → this is **`DIRECT_URL`**.
- [ ] Copy Project URL → **`NEXT_PUBLIC_SUPABASE_URL`**; `anon` key → **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**;
      `service_role` key → **`SUPABASE_SERVICE_ROLE_KEY`**.
- [ ] Auth → URL Configuration: add `https://<domain>/auth/callback` to redirect URLs.

## C. GitHub

- [ ] `.env*` is git-ignored (no secrets committed).
- [ ] Push to `main`.

## D. Vercel project

- [ ] Import the GitHub repo.
- [ ] **Root Directory** = `english-ai` if this project is a subfolder, else `.`.
- [ ] Framework = Next.js; Build Command = `npm run build`; Install = `npm ci` (from `vercel.json`).
- [ ] Add **Environment Variables (Production)**:
  - [ ] `DATABASE_URL` (pooled) · `DIRECT_URL` (direct)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL` = `https://<domain>`
  - [ ] (optional AI) `AI_PROVIDER`, `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`, `AI_FALLBACK_PROVIDER`,
        `AI_TIMEOUT_MS`, `AI_MAX_RETRIES`, `AI_CIRCUIT_FAILURE_THRESHOLD`, `AI_CIRCUIT_COOLDOWN_MS`
  - [ ] ⚠️ Confirm `NEXT_PUBLIC_*` are set **before** the first build (build-time inlined).
- [ ] Trigger the first **Deploy** → build is green (app compiles; DB untouched yet).

## E. Database release (migrations + seed) — REQUIRED

Run with the **production** `DATABASE_URL` + `DIRECT_URL` exported (uses the direct connection):

- [ ] `npm ci`
- [ ] `npm run db:release` ( = `prisma migrate deploy` **then** `tsx prisma/seed.ts` )
- [ ] Confirm migrations applied: `20260701000000_init`, `20260701010000_ai_usage_logs`,
      `20260702000000_auth_user_sync` (auth triggers), `20260702010000_persistence_stores`.
- [ ] Confirm seed: roles/permissions, CEFR A1 + 100 words, Mission Library (4 tracks × 10),
      prompt templates. (Idempotent — safe to re-run.)

> Alternative: run `npm run db:release` from a GitHub Actions job gated on the Vercel deploy, or set
> the Vercel Build Command to `prisma migrate deploy && npm run build` (couples build to DB — only
> if you accept that). See VERCEL_DEPLOY.md §5.

## F. Verify production

- [ ] `GET /api/health` → `{ status: "ok", config: { supabase: true, database: true } }`.
- [ ] `GET /api/health/ai` → 200 (`unconfigured` if no AI keys; `ok`/`degraded` otherwise).
- [ ] Sign up → `profiles` row + `user_roles = student` auto-created (trigger); log in; `/dashboard`.
- [ ] `/learn/missions` renders the seeded library; `/admin/prompts` lists templates (as admin).
- [ ] (If AI keys) trigger an explanation → `ai_usage_logs` row `status=success`, cost > 0.

## G. Post-deploy

- [ ] Custom domain added; `NEXT_PUBLIC_APP_URL` updated; redeploy.
- [ ] Vercel plan: **Pro** (60s functions) fits `AI_TIMEOUT_MS=20000`; on Hobby (10s) lower it.
- [ ] Uptime alert on `/api/health`; degradation alert on `/api/health/ai`.
- [ ] (Scale-out only) wire a shared Redis (e.g. Upstash) before running >1 instance — the AI
      circuit breaker + rate limiter are in-memory today.

## H. Rollback

- [ ] App: Vercel → Deployments → promote previous deployment.
- [ ] Schema: use ADR-0004 / ADR-0005 rollback SQL; never edit an applied migration — add a new one.

---

## Blockers fixed in DEPLOY-01 (no feature/UI/refactor)

| Blocker (from DEPLOYMENT_AUDIT §18)   | Fix                                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `prisma migrate deploy` not automated | Added `prisma:migrate:deploy` + `db:release` scripts (release step, kept out of `build`).                             |
| Production seed                       | `db:release` runs the idempotent `prisma/seed.ts` (RBAC + vocab + Mission Library + prompts).                         |
| `DIRECT_URL`                          | `schema.prisma` datasource now declares `directUrl = env("DIRECT_URL")`; documented + in `.env.example`.              |
| `NEXT_PUBLIC_*`                       | Documented as build-time inlined; set in Vercel before first build (Vercel provides them to the build automatically). |
| Health check                          | `/api/health` (+ `/api/health/ai`) verified; wired into the checklist + monitoring guidance.                          |
| `.env.example` drift                  | Added `DIRECT_URL` (required) + `AI_CIRCUIT_FAILURE_THRESHOLD` / `AI_CIRCUIT_COOLDOWN_MS`.                            |

**Not changed:** no application code, UI, or features. Build passes with no serious warnings (only a
Prisma 6→7 forward-deprecation notice, resolved when upgrading to Prisma 7 via `prisma.config.ts`).
