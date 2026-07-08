# ARCHITECTURE_EVOLUTION.md — English AI

> How the architecture is **intended to change over time**, and the **objective
> criteria** that trigger each change. This document exists so scaling decisions are
> made on **evidence**, not vibes — and so no future step requires a big-bang
> rewrite. Read with [ADR-0001](./adr/ADR-0001.md) and
> [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md).

---

## 1. Guiding principle

> **Package boundaries first, deployment boundaries later.**

We enforce clean **module** boundaries from day one (framework-light domain code,
provider ports, inward dependencies) but keep a **single deployment** until a measured
need forces a split. Because the boundaries already exist, "splitting" becomes moving a
folder and adding a queue — not redesigning the system.

---

## 2. Stage 0 — Current architecture (Sprint 1–~16)

**Shape:** one Next.js full-stack app deployed to Vercel; Postgres via Supabase/Prisma;
Supabase Auth. No separate API, no worker, no realtime service.

```
                ┌──────────────────────────────┐
  Browser  ───▶ │  Next.js app (Vercel)        │
                │  ├─ App Router UI (RSC)       │
                │  ├─ Route Handlers (BFF/API)  │
                │  └─ Server Actions            │
                └───────┬───────────────┬───────┘
                        │               │
                 Supabase Auth     Prisma ──▶ PostgreSQL (Supabase)
```

**Repo layout today (single app at root):**

```
/src, /prisma, /next.config.mjs …        ← the live app
/apps/{web,worker}                        ← RESERVED placeholders (README only)
/packages/{shared,ui,ai,database,         ← RESERVED placeholders (README only)
           learning-engine,srs}
```

**Why this is safe:** domain logic is written as if already packaged (see
`packages/*` READMEs). The reserved directories document the destination so the move
is mechanical.

**Known limits (accepted for now):** no durable background jobs, no WebSocket realtime,
web and API scale/deploy together.

---

## 3. Target architecture (end state)

```
        ┌── apps/web (Next.js, Vercel) ──┐        ┌── apps/worker (Railway) ──┐
Browser▶│  UI + thin BFF                 │  enqueue│  BullMQ consumers:        │
        │  calls domain packages         │────────▶│  AI gen · TTS · scoring · │
        └───────────────┬────────────────┘  Redis  │  SRS batch · notifications│
                        │                            └──────────┬───────────────┘
   ┌── apps/realtime (WS) ──┐                                   │
   │  conversation/speaking │                                   │
   └───────────┬────────────┘                                   │
               └───────────────┬───────────────────────────────┘
                               ▼
         packages/{shared, database, ai, learning-engine, srs, ui}
                               ▼
                     PostgreSQL (+pgvector) · Redis · Object storage
```

Every app is a **thin shell** over the same domain packages. State lives in Postgres /
Redis / object storage — never in-process shared across apps.

---

## 4. Migration milestones & triggers

Each step is independent and **triggered by evidence**. Do the step only when a
trigger fires; record the decision (extend ADR-0001 or add a new ADR).

### M-A · Extract shared packages (`packages/*`)

- **What:** move `src/lib` domain code into `shared`, `database`, `ai`,
  `learning-engine`, `srs`; adopt npm workspaces + Turborepo; move the app to `apps/web`.
- **Trigger (any):**
  - A **second consumer** appears (Expo mobile, or the worker below) that must import
    domain code, **or**
  - `src/lib` domain code exceeds ~2–3k LOC and cross-imports get tangled, **or**
  - more than one engineer regularly conflicts in `src/lib`.
- **Expected window:** alongside M-B, or when mobile starts (post-Sprint 24).
- **Effort:** low–medium (mechanical; boundaries already respected).

### M-B · Extract the background worker (`apps/worker`) — **first likely split**

- **What:** stand up a Node worker consuming **BullMQ (Redis)**; move AI generation,
  TTS rendering, scoring callbacks, SRS batch, notifications off the request path. Web
  **enqueues** and reads job status (`ai_generation_jobs`).
- **Trigger (any):**
  - First **durable async workload** ships (AI lesson generation / TTS / scoring), **or**
  - a Route Handler needs > ~10 s or heavy CPU/memory, **or**
  - serverless function timeouts/cost from long AI calls become material, **or**
  - ret/retry + rate-limit orchestration for provider calls is needed.
- **Expected window:** **Sprint 17–22** (AI & speech).
- **Effort:** medium. **Prereq:** Redis provisioned; `packages/ai` + `packages/database`
  usable from a non-Next runtime (already the design).

### M-C · Extract realtime service (`apps/realtime`)

- **What:** dedicated WebSocket service (Socket.IO + Redis adapter) for live
  conversation/speaking streaming.
- **Trigger (any):**
  - Interactive voice/streaming conversation is built and Vercel's model can't serve
    persistent sockets well, **or**
  - realtime concurrency or latency SLOs aren't met on the current setup.
- **Expected window:** when voice-first conversation lands (Phase 2+, ~Sprint 18–20 if
  streaming is required earlier).
- **Effort:** medium.

### M-D · Split read scaling & data tier

- **What:** Postgres **read replicas**, **partition** hot append-only tables
  (`srs_reviews`, `analytics_events`, `ai_usage_logs`), add caching/CDN tuning.
- **Trigger (any):**
  - Primary DB CPU sustained > 70%, **or** read p95 breaches SLO, **or**
  - a hot table exceeds ~50–100M rows / index bloat degrades queries.
- **Expected window:** Sprint 39 (Scale) or earlier if metrics demand.

### M-E · Regionalization / dedicated API

- **What:** if web↔API deploy coupling or global latency becomes a bottleneck, split a
  standalone API service (NestJS per original design) and/or multi-region.
- **Trigger (any):**
  - Deploy coupling blocks release cadence, **or** API and UI have divergent scaling
    profiles, **or** a large non-web client set consumes the API directly.
- **Expected window:** only if measured; possibly never for a single-product MVP.

---

## 5. Decision criteria (how we decide it's "time")

Split when **at least one** is true — and prefer the smallest step that resolves it:

| Signal          | Threshold (starting point, tune with data)                            |
| --------------- | --------------------------------------------------------------------- |
| Request latency | Route Handler p95 > 3 s, or any sync path > 10 s                      |
| Async need      | A workload must run out-of-band (retryable, > 10 s, scheduled)        |
| Cost            | Serverless execution cost for long AI calls > worker-hosting cost     |
| Reliability     | Provider timeouts/rate-limits need queue + backoff orchestration      |
| Scaling profile | Two workloads need to scale independently (e.g., UI vs AI throughput) |
| Team            | Multiple owners contend on one deployable / release train             |
| Data            | DB CPU > 70% sustained, or hot table > ~50–100M rows                  |
| New client      | A second app (mobile) must share typed domain code                    |

**Anti-triggers (do NOT split just because):** "microservices are best practice",
"the code feels big", "it might scale someday". Premature splitting adds ops cost with
no benefit — [ADR-0001](./adr/ADR-0001.md) §Alternatives.

---

## 6. Review cadence

- Re-check this document at the **end of each phase** (M1 S16, M2 S24, …) and whenever a
  §5 signal is observed in monitoring.
- Any split is recorded as an ADR (extends/supersedes ADR-0001) with the metric that
  triggered it.
- If a checkpoint passes with no trigger, note "no change" and set the next checkpoint —
  staying single-app is a valid, recorded decision.
