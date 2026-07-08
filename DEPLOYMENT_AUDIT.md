# DEPLOYMENT_AUDIT.md — English AI

> Role: Senior DevOps Engineer. Goal: **analysis only, no code changes** — assess the project's
> deployability and recommend an optimal deploy architecture. Date: 2026-07-02.

---

## 0. TL;DR

A **single Next.js 15 full-stack app** (App Router; frontend + backend in one deployable), **npm**,
**Prisma + PostgreSQL (Supabase in prod)**, **Supabase Auth**. Ships ready-made **Dockerfile
(standalone)**, **railway.json**, **vercel.json**, **docker-compose** (Postgres + Redis), `.nvmrc`
20, and a `/api/health` probe. **It is deployable today on Vercel, Railway, and Render.**

**Recommended:** **Vercel (web) + Supabase (Postgres + Auth)** for the beta — least ops; keep the
Docker/Railway path as the portable fallback and future home for the `apps/worker`. Fix five
deploy-prep gaps first (see §18): migrations release step, Prisma `directUrl`, `NEXT_PUBLIC_*` at
build time (Docker), Redis for shared state, and a stale `.env.example`.

---

## 1. Framework

- **Next.js `^15.1.4`** (App Router) + **React `19`** + **TypeScript `5.7`**.
- **No** Express / NestJS / standalone API server. The "backend" is Next.js itself: **route
  handlers** (`src/app/api/**`) + **Server Actions** + server-only modules.
- Styling: TailwindCSS 3 + shadcn/ui-style components. ORM: Prisma 6. Validation: Zod. Tests: Vitest.

## 2. Frontend — where is it?

`src/app/**` (App Router pages/layouts) + `src/components/**`. Rendered by the same Next.js server
(SSR/RSC + client components). There is **no separate frontend project** — it is co-deployed with
the backend as one Next app.

## 3. Backend — where is it?

Same Next.js app:

- **HTTP API:** `src/app/api/**` route handlers — e.g. `/api/health`, `/api/health/ai`,
  `/api/v1/**` (vocabulary read API), `/auth/callback`.
- **Server Actions & server-only services:** `src/lib/**` (auth/session/supabase) and
  `src/modules/**` (hexagonal: domain/application/infrastructure). Prisma access is server-only.

## 4. Monorepo?

**No — effectively a single-package repo.** `apps/{web,worker}` and `packages/{shared,ui,ai,
database,learning-engine,srs}` exist but are **README-only placeholders** (reserved scaffolding per
ADR-0001, no code, no workspaces field in `package.json`). All real code lives at the repo root
under `src/`. Deploy it as **one app**. (`next.config.mjs` sets `outputFileTracingRoot` to this
project because a sibling lockfile exists in the parent workspace dir — good, avoids mis-tracing.)

## 5. Package manager

**npm** — `package-lock.json` is the lockfile (`npm ci` in Dockerfile and `vercel.json`
`installCommand`). Not pnpm/bun/yarn. `engines.node >= 20`, `.nvmrc = 20`.

## 6. Database

**PostgreSQL.** Local: `docker-compose.yml` runs `postgres:16-alpine`. Production: **Supabase
Postgres** (per ADR-0001/0002). 47 tables (see PERSISTENCE_READY_REPORT). Supabase also owns
`auth.users`; app identity is `public.profiles` linked by DB triggers (ADR-0004).

## 7. ORM

**Prisma `^6.2.1`** (`@prisma/client` + `prisma` CLI). Schema: `prisma/schema.prisma`
(`provider = postgresql`, `url = env("DATABASE_URL")`). Migrations in `prisma/migrations/**` (4
migrations). Seed: `tsx prisma/seed.ts` (RBAC + A1 vocab + Mission Library + prompt templates).

## 8. Environment variables

Source of truth: `src/lib/env.ts` (Zod-validated, non-throwing) + `.env.example`. **Build/dev do
not require real values** (safe defaults); production requires the ones marked Required.

| Variable                        | Req/Opt             | Scope           | Notes                                                                                        |
| ------------------------------- | ------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | **Required (prod)** | server          | Postgres/Supabase connection. App runs build without it; runtime needs it.                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | **Required (prod)** | client (build!) | Inlined at **build** time. Auth is off without it.                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Required (prod)** | client (build!) | Inlined at **build** time.                                                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Recommended         | server          | Needed for admin ops (e.g. delete user). Never exposed to client.                            |
| `DIRECT_URL`                    | Recommended (prod)  | server          | Direct (non-pooled) URL for `prisma migrate` on Supabase. **Not yet wired in schema** (§18). |
| `NEXT_PUBLIC_APP_URL`           | Optional            | client          | Default `http://localhost:3000`.                                                             |
| `NEXT_PUBLIC_APP_NAME`          | Optional            | client          | Default "English AI".                                                                        |
| `AI_PROVIDER`                   | Optional            | server          | `anthropic` (default) \| `openai`.                                                           |
| `AI_FALLBACK_PROVIDER`          | Optional            | server          | `anthropic` \| `openai` \| `none` (default).                                                 |
| `ANTHROPIC_API_KEY`             | Conditional         | server          | Required only if using Anthropic. Blank → deterministic fallback.                            |
| `OPENAI_API_KEY`                | Conditional         | server          | Required only if using OpenAI.                                                               |
| `AI_DEFAULT_MODEL`              | Optional            | server          | Overrides `config/models.ts`.                                                                |
| `AI_TIMEOUT_MS`                 | Optional            | server          | Default `20000`.                                                                             |
| `AI_MAX_RETRIES`                | Optional            | server          | Default `2`.                                                                                 |
| `AI_CIRCUIT_FAILURE_THRESHOLD`  | Optional            | server          | Default `5`. **Missing from `.env.example`** (§18).                                          |
| `AI_CIRCUIT_COOLDOWN_MS`        | Optional            | server          | Default `30000`. **Missing from `.env.example`** (§18).                                      |
| `NODE_ENV`                      | Platform-set        | server          | `production` in the runner.                                                                  |
| `PORT` / `HOSTNAME`             | Platform-set        | server          | Dockerfile defaults `3000` / `0.0.0.0`.                                                      |
| `NEXT_TELEMETRY_DISABLED`       | Optional            | build/runtime   | Set to `1` in Dockerfile.                                                                    |

> ⚠️ **`NEXT_PUBLIC_*` are build-time inlined.** They must be present **when `next build` runs**
> (automatic on Vercel; must be passed as build args in Docker — see §13/§18), otherwise the client
> bundle ships with default/empty Supabase config and auth won't work until rebuilt.

> Note: `Redis` (docker-compose) has **no env var and is not consumed by code yet** — rate limiting
> is in-memory today. A `REDIS_URL` becomes Required only when shared rate-limit/circuit state lands.

## 9. Build command

`npm run build` → **`prisma generate && next build`**. (`vercel.json` uses `npm run build`;
Dockerfile builder runs `npm run build`.) Build succeeds without live services (pages that read the
DB are dynamic/auth-gated; admin pages are `force-dynamic`). Output: **standalone**.

## 10. Start command

- **Standalone / container (Railway, Docker, Render-Docker):** **`node server.js`** (from
  `.next/standalone`; set in `railway.json` and Dockerfile `CMD`).
- **Node host / local:** `npm start` → `next start`.
- **Vercel:** managed (no start command; serverless/edge functions).
- **DB lifecycle (all platforms):** `prisma migrate deploy` + `npm run prisma:seed` must run as a
  **release/pre-deploy step** — currently **not** automated anywhere (§18).

## 11. Output folder

`.next/` (build), with `output: 'standalone'` producing **`.next/standalone/`** (self-contained
server incl. minimal `node_modules` + `server.js`), plus **`.next/static/`** and **`public/`**
(both copied into the runner image). On Vercel the output is managed by the platform.

## 12. Production config

- `next.config.mjs`: `output: 'standalone'`, `reactStrictMode`, `poweredByHeader: false`,
  `outputFileTracingRoot` pinned to this project.
- Runner: `NODE_ENV=production`, non-root user (`nextjs:nodejs`), `EXPOSE 3000`, `HOSTNAME=0.0.0.0`.
- Health probe: **`GET /api/health`** (config flags) + **`GET /api/health/ai`** (AI layer,
  503-on-degraded). `railway.json` uses `/api/health` (timeout 120s, restart on failure ×10).
- Env validation is non-throwing (`src/lib/env.ts`) with `getEnvIssues()` for diagnostics; auth path
  fails loudly via `assertAuthConfigured()`.

## 13. Docker?

**Yes.** Multi-stage `Dockerfile` (`node:20-alpine`, `libc6-compat`): `deps` (`npm ci` + prisma) →
`builder` (`npm run build`) → `runner` (copies `public`, `.next/standalone`, `.next/static`,
`prisma`; non-root; `node server.js`). Plus `.dockerignore` and `docker-compose.yml` (Postgres 16 +
Redis 7 + optional `app` under the `full` profile). **Gap:** the builder stage declares **no `ARG`/
`ENV` for `NEXT_PUBLIC_*`**, so container builds bake default Supabase config (§8/§18). Migrations
are **not** run in the image (correct — should be a release step).

## 14. Deploy to Vercel?

**Yes — first-class.** Native Next.js; `vercel.json` present (`framework: nextjs`,
`buildCommand: npm run build`, `installCommand: npm ci`, `regions: ["sin1"]`, deploy on `main`).
`prisma generate` is in the build script (required on Vercel). Considerations:

- Use the **Supabase pooled** connection (PgBouncer, port 6543) for serverless `DATABASE_URL`; add
  `DIRECT_URL` for migrations (§18).
- `output: 'standalone'` is ignored by Vercel (harmless).
- **Serverless caveats (by design, documented):** the AI **circuit breaker** and the **rate limiter**
  are in-memory → per-invocation/per-instance, not shared. Fine for beta; add Upstash Redis for
  shared state later.
- Run `migrate deploy` + `seed` outside the request path (CI step or one-off), not in the build.

## 15. Deploy to Railway?

**Yes — best container fit.** `railway.json` (`builder: DOCKERFILE`, `startCommand: node server.js`,
healthcheck `/api/health`, restart-on-failure). Long-lived container → circuit-breaker/in-memory
state is coherent per instance; Redis is easy to add; matches the future `apps/worker` split.
Add: a **release command** `prisma migrate deploy` (Railway supports pre-deploy/release commands),
and pass `NEXT_PUBLIC_*` as build args (§18). Use Railway Postgres or Supabase.

## 16. Deploy to Render?

**Yes, but not pre-configured** (no `render.yaml`). Two options: (a) **Docker Web Service** using the
existing `Dockerfile` (set health check path `/api/health`, port 3000, start `node server.js`); or
(b) native Node — build `npm run build`, start `npm start`. Add a **pre-deploy command**
`prisma migrate deploy`. Adding a `render.yaml` (web service + optional Postgres/Redis) would make it
one-click. Functionally equivalent to Railway.

## 17. Recommended deploy architecture

Two clean options; pick by operational appetite.

### ✅ Option A — Vercel + Supabase (recommended for beta)

```
[ Vercel ] Next.js (SSR/RSC + API routes + Server Actions)  ── region sin1
      │  DATABASE_URL = Supabase pooled (6543)   DIRECT_URL = Supabase direct (5432, migrate)
      ▼
[ Supabase ] Postgres 16  +  Auth (auth.users → profiles via triggers)
      ▲
      └── CI/release: prisma migrate deploy → prisma:seed
[ Upstash Redis ] (add later) → shared rate limit + circuit state
[ Anthropic / OpenAI ] via server-only API keys (optional; graceful fallback)
```

- **Why:** least ops, autoscale, free/cheap, Next-native; Supabase gives Postgres **and** Auth in one.
- **Trade-offs:** serverless → in-memory circuit/rate-limit are per-instance (documented, acceptable
  for beta; Upstash fixes it). Background jobs (future `apps/worker`) don't fit serverless — move to
  Option B or a Railway worker when async work lands.

### 🅱 Option B — Railway (Docker) + Supabase/Railway Postgres (if you want one long-lived server)

```
[ Railway ] Docker (standalone, node server.js)  ──  healthcheck /api/health
      │  release: prisma migrate deploy
      ├── [ Postgres ] (Railway or Supabase)
      └── [ Redis ] (Railway plugin) → rate limit + shared state
   (+ future) [ Railway worker ] ← apps/worker for async AI/jobs
```

- **Why:** persistent instance (coherent in-memory state), trivial Redis, natural home for the
  worker split, single vendor for app+db+redis. **Trade-off:** you manage a container/scaling.

**Recommendation:** **Option A (Vercel + Supabase)** now for the beta; keep the Dockerfile +
`railway.json` as the portable escape hatch and adopt Option B (or a hybrid: Vercel web + Railway
worker) when background processing or shared in-memory state becomes necessary.

---

## 18. Pre-deploy gaps to close (DevOps checklist — no code changed by this audit)

1. **Migrations release step** — no platform runs `prisma migrate deploy` + `prisma:seed`
   automatically. Add a release/pre-deploy command (Railway/Render) or a CI job (Vercel). **Blocker
   for first deploy.**
2. **Prisma `directUrl`** — schema declares only `url`. For Supabase (pooled runtime + direct
   migrate), add `directUrl = env("DIRECT_URL")` to the datasource and set `DIRECT_URL`. Without it,
   `migrate deploy` against a PgBouncer URL can fail.
3. **`NEXT_PUBLIC_*` at build (Docker)** — the Dockerfile builder receives no `ARG`/`ENV` for
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`; container builds would bake empty
   client config. Pass them as build args (Vercel handles this automatically).
4. **Redis / shared state** — `docker-compose` provisions Redis but code doesn't use it; rate limit
   and AI circuit breaker are in-memory. For multi-instance/serverless correctness, wire a
   `REDIS_URL` (e.g. Upstash) before scaling beyond one instance.
5. **`.env.example` drift** — missing `AI_CIRCUIT_FAILURE_THRESHOLD`, `AI_CIRCUIT_COOLDOWN_MS`
   (added in RC-04) and `DIRECT_URL` is only a comment. Update the template so deployers set them.
6. **Secrets** — ensure real keys (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`,
   `DATABASE_URL`) are set as platform secrets, never committed. Rotate the docker-compose default
   Postgres password (`englishai/englishai`) — local-only, must not reach prod.
7. **Health checks** — point the platform health check at `/api/health` (already in `railway.json`;
   set it on Render/Vercel monitoring). Optionally alert on `/api/health/ai` degradation.

> This audit is analysis only — **no application code, config, or schema was modified.** The items in
> §18 are recommendations for a deploy-prep pass.
