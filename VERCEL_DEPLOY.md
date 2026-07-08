# VERCEL_DEPLOY.md — English AI → Vercel Production

> Role: Principal DevOps Engineer. End-to-end production deploy: **GitHub → Vercel → Supabase →
> Production**. Companion: [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) (step-by-step),
> [DEPLOYMENT_AUDIT.md](./DEPLOYMENT_AUDIT.md) (architecture). No feature/UI/refactor changes are
> made by deploying — this is configuration + release process only.

---

## 0. Architecture

```
GitHub (repo)
   │  push to main
   ▼
Vercel  ── Next.js 15 (SSR/RSC + API routes + Server Actions), region sin1
   │  build: npm run build  (prisma generate && next build)
   │  runtime env: DATABASE_URL (pooled), DIRECT_URL (direct), NEXT_PUBLIC_*, AI keys
   ▼
Supabase
   ├─ Postgres 16  (pooled :6543 for runtime, direct :5432 for migrate)
   └─ Auth (auth.users → public.profiles via triggers, ADR-0004)
   ▲
   └── Release step (one-off / CI):  npm run db:release
        = prisma migrate deploy  +  prisma seed  (RBAC, A1 vocab, Mission Library, prompt templates)
```

Two connection strings are used (standard Supabase + Prisma on serverless):

- **`DATABASE_URL`** → **pooled** (PgBouncer, port **6543**, add `?pgbouncer=true`). Used by the
  app at runtime; safe for many short-lived serverless connections.
- **`DIRECT_URL`** → **direct** (port **5432**). Used by `prisma migrate deploy`. The schema now
  declares `directUrl = env("DIRECT_URL")`, so migrations never run through the pooler.

> Locally or without a pooler, set **`DIRECT_URL = DATABASE_URL`** (both required — the schema
> references `DIRECT_URL`).

---

## 1. Prerequisites

- GitHub repository containing this project.
- Vercel account (Pro recommended: 60s function timeout fits the 20s AI timeout; Hobby caps at 10s).
- Supabase project (Postgres + Auth).
- (Optional) Anthropic and/or OpenAI API keys — the app runs without them (deterministic fallback).

---

## 2. Supabase setup

1. Create a Supabase project; wait for Postgres to provision.
2. **Connection strings** — Project → Settings → Database:
   - **Connection pooling** (Transaction mode) string → this is **`DATABASE_URL`**. Append
     `?pgbouncer=true&connection_limit=1` (serverless-friendly).
   - **Direct connection** string → this is **`DIRECT_URL`**.
3. **API keys** — Project → Settings → API:
   - Project URL → **`NEXT_PUBLIC_SUPABASE_URL`**
   - `anon` public key → **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - `service_role` key → **`SUPABASE_SERVICE_ROLE_KEY`** (server-only; never expose).
4. Keep these for step 4. Do **not** commit them.

---

## 3. GitHub

1. Commit the project (ensure `.env*` is git-ignored — it is).
2. Push to `main`. Vercel deploys `main` by default (`vercel.json` → `git.deploymentEnabled.main`).

---

## 4. Vercel project

1. **New Project → Import** the GitHub repo.
2. **Root Directory:** if the repo root **is** this project, leave `.`. If this project is a
   subfolder (e.g. `english-ai/` inside a larger workspace), set Root Directory to **`english-ai`**.
   (`next.config.mjs` pins `outputFileTracingRoot` to the project, so tracing is correct either way.)
3. **Framework Preset:** Next.js (auto). **Build Command:** `npm run build` (from `vercel.json`).
   **Install Command:** `npm ci`. **Output:** managed by Vercel (the repo's `output: 'standalone'`
   is ignored by Vercel — harmless).
4. **Environment Variables** (Project → Settings → Environment Variables), for **Production** (and
   Preview if desired):

   | Variable                                                  | Value                                                   |
   | --------------------------------------------------------- | ------------------------------------------------------- |
   | `DATABASE_URL`                                            | Supabase **pooled** string (`:6543`, `?pgbouncer=true`) |
   | `DIRECT_URL`                                              | Supabase **direct** string (`:5432`)                    |
   | `NEXT_PUBLIC_SUPABASE_URL`                                | Supabase Project URL                                    |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`                           | Supabase `anon` key                                     |
   | `SUPABASE_SERVICE_ROLE_KEY`                               | Supabase `service_role` key                             |
   | `NEXT_PUBLIC_APP_URL`                                     | `https://<your-domain>`                                 |
   | `AI_PROVIDER`                                             | `anthropic` or `openai` (optional; default `anthropic`) |
   | `ANTHROPIC_API_KEY`                                       | your key (optional)                                     |
   | `OPENAI_API_KEY`                                          | your key (optional)                                     |
   | `AI_FALLBACK_PROVIDER`                                    | `none` \| `anthropic` \| `openai` (optional)            |
   | `AI_TIMEOUT_MS` / `AI_MAX_RETRIES`                        | optional (defaults 20000 / 2)                           |
   | `AI_CIRCUIT_FAILURE_THRESHOLD` / `AI_CIRCUIT_COOLDOWN_MS` | optional (defaults 5 / 30000)                           |

   > **`NEXT_PUBLIC_*` are inlined at build time** — set them before the first build. Changing them
   > later requires a redeploy (rebuild), not just a runtime restart. `NODE_ENV`/`PORT` are set by
   > Vercel.

5. **Deploy** (first build). It compiles the app; it does **not** touch the database (migrations are
   a separate release step — see §5). A green build here means the app is ready to receive the
   schema.

---

## 5. Database release (migrations + seed)

Run **once per schema change** (and once on first deploy). Migrations are intentionally **not** in
the build command (so builds are deterministic and parallel builds don't race on the DB). Use the
**direct** connection.

**Option A — locally against production (simplest):**

```bash
# with the PRODUCTION DATABASE_URL + DIRECT_URL exported in your shell:
npm ci
npm run db:release      # = prisma migrate deploy  &&  prisma seed
```

**Option B — CI (GitHub Actions) post-deploy job:** run `npm ci && npm run db:release` with the
production `DATABASE_URL`/`DIRECT_URL` as secrets, gated on a successful Vercel deploy.

**Option C — Vercel build hook:** set the Build Command to
`prisma migrate deploy && npm run build` in the Vercel dashboard (env is available at build). Only
do this if you accept coupling builds to DB writes; Option A/B is recommended.

`db:release` runs:

1. **`prisma migrate deploy`** — applies all 4 migrations, including
   `20260702000000_auth_user_sync` (the Supabase auth → profiles/user_roles triggers) and
   `20260702010000_persistence_stores`.
2. **`prisma seed`** (`tsx prisma/seed.ts`, idempotent upserts) — RBAC (permissions/roles), the CEFR
   A1 level with 100 vocabulary words, the Mission Library (4 tracks × 10 missions), and prompt
   templates.

> The seed is **idempotent** (upserts) — safe to re-run. It seeds roles **before** any sign-up so
> the `handle_new_user` trigger can assign the default `student` role.

---

## 6. Verify production

1. **Health:** `GET https://<domain>/api/health` → `{ status: "ok", config: { supabase: true,
database: true } }`. `GET /api/health/ai` → provider/circuit status (503 only if degraded).
2. **Auth end-to-end:** sign up a new email → confirm a `profiles` row + `user_roles = student`
   are created by the trigger; log in; visit `/dashboard`.
3. **Content from DB:** `/learn/missions` renders the seeded Mission Library; `/admin/prompts`
   (as an admin) lists prompt templates; `/admin/ai-metrics` renders (empty until traffic).
4. **AI (if keys set):** trigger a vocabulary explanation → an `ai_usage_logs` row appears
   (`status=success`, tokens/cost > 0); otherwise the deterministic fallback answers.

---

## 7. Post-deploy

- **Custom domain:** add it in Vercel; update `NEXT_PUBLIC_APP_URL` and redeploy.
- **Supabase Auth redirect URLs:** add `https://<domain>/auth/callback` to Supabase Auth settings.
- **Function duration:** on Vercel Pro, AI-calling routes/actions get up to 60s (fits `AI_TIMEOUT_MS`
  = 20s). On Hobby (10s cap), lower `AI_TIMEOUT_MS` (e.g. 8000) or upgrade.
- **Shared state (scale-out):** the AI circuit breaker and rate limiter are in-memory (per
  instance/invocation). Before scaling beyond one instance, wire a shared store (e.g. Upstash Redis).
- **Monitoring:** alert on `/api/health` (uptime) and `/api/health/ai` (degradation).

---

## 8. Rollback

- **App:** Vercel → Deployments → promote the previous successful deployment (instant).
- **Schema:** migrations are additive; to revert the auth triggers use the rollback SQL in
  `docs/adr/ADR-0004.md`, and for the persistence stores use `docs/adr/ADR-0005.md`. Never edit an
  applied migration — add a new one.
