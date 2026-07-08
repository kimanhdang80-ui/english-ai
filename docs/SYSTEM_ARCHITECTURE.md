# SYSTEM_ARCHITECTURE.md — English AI

> How the system is composed, why each choice was made, and how it scales.
> This document is authoritative for all technology and structural decisions.

> **⚠️ MVP amendment ([ADR-0001](./adr/ADR-0001.md)):** the
> current implementation runs as a **single Next.js full-stack app with Supabase
> Auth** (Vercel + Railway) rather than the NestJS monorepo described below. The
> NestJS/monorepo design remains the target for the first **extracted service**;
> the principles here (hexagonal boundaries, provider ports, scalability strategy)
> still apply. Read this document together with ADR-0001 and
> [ARCHITECTURE_EVOLUTION.md](./ARCHITECTURE_EVOLUTION.md).

---

## 1. Architectural Principles

1. **Modular monolith first, microservice-ready.** Start as one well-bounded backend split into modules by domain. Extract services (AI, media, exams) only when scale demands it.
2. **Clean/Hexagonal boundaries.** Domain logic never depends on frameworks, HTTP, or the database directly. Adapters plug in at the edges.
3. **Stateless services, stateful stores.** App servers hold no session state → horizontal scaling is trivial.
4. **Async by default for AI & media.** Anything slow or costly (LLM generation, TTS, scoring) runs through a job queue, never blocking a request.
5. **Everything is versioned.** API (`/v1`), content, prompts, and DB migrations.
6. **Observability is not optional.** Every request is traceable; every AI call is logged with cost and latency.

## 2. High-Level Diagram

```
                         ┌──────────────────────────────────────────┐
   Web (Next.js)         │                CLIENTS                   │
   Mobile (Expo/RN)  ───▶│  Web SPA/SSR · iOS · Android · PWA        │
                         └───────────────┬──────────────────────────┘
                                         │ HTTPS / WSS
                                 ┌───────▼────────┐
                                 │   API Gateway  │  (Edge: TLS, rate-limit,
                                 │  / BFF layer   │   auth verify, routing)
                                 └───────┬────────┘
                                         │
             ┌───────────────────────────┼───────────────────────────┐
             │                           │                           │
     ┌───────▼────────┐        ┌─────────▼─────────┐       ┌─────────▼─────────┐
     │  Core API      │        │  Realtime Service  │       │  AI Orchestrator  │
     │  (NestJS)      │        │  (WS: conversation │       │  (LLM, STT, TTS,  │
     │  domain modules│        │   & live speaking) │       │   scoring, embed) │
     └───┬───────┬────┘        └─────────┬──────────┘       └───┬──────────┬────┘
         │       │                       │                      │          │
   ┌─────▼──┐ ┌──▼───────┐         ┌─────▼─────┐         ┌──────▼───┐  ┌───▼─────┐
   │Postgres│ │  Redis   │         │  Redis    │         │ Provider │  │ Vector  │
   │ (+pgvec)│ │cache/queue│        │ pub/sub   │         │ APIs     │  │(pgvector)│
   └────────┘ └──────────┘         └───────────┘         │Claude/STT│  └─────────┘
                                                          │/TTS/Score│
   ┌──────────────┐   ┌──────────────┐                   └──────────┘
   │ Object Store │   │ Worker Pool  │  (BullMQ consumers: lesson gen,
   │ (S3 / R2)    │   │              │   TTS render, scoring, SRS jobs)
   └──────────────┘   └──────────────┘
```

## 3. Frontend

- **Framework:** Next.js 15 (App Router) + React 19, TypeScript (strict).
- **Styling:** Tailwind CSS + **shadcn/ui** (Radix primitives) — see [UI_GUIDELINE.md](./UI_GUIDELINE.md).
- **State:** Zustand (client/UI state) + **TanStack Query** (server state, caching, retries).
- **Forms/Validation:** React Hook Form + Zod (schemas shared with backend where possible).
- **i18n:** `next-intl` — UI localized into the learner's native language.
- **Audio:** Web Audio API + MediaRecorder for speaking capture; HLS/streaming for listening.
- **Realtime:** Socket.IO client for AI conversation & live speaking.
- **PWA:** installable, offline cache for due SRS cards.
- **Mobile (Phase 2+):** Expo / React Native sharing the domain SDK and design tokens.

**Rationale:** Next.js gives SSR/SEO for marketing + app shell, React ecosystem depth, and a smooth path to React Native code sharing.

## 4. Backend

- **Framework:** **NestJS** (TypeScript) — opinionated modular DI, guards, interceptors, pipes; maps cleanly to hexagonal architecture.
- **Structure:** modular monolith. Each domain = a Nest module with its own controller (adapter), service (use cases), and repository (port).
- **Transport:** REST (`/api/v1`, see [API.md](./API.md)) + WebSocket (realtime) + internal job queue.
- **Validation:** class-validator / Zod DTOs at the boundary; domain never trusts raw input.
- **Background jobs:** **BullMQ** (Redis) workers for AI generation, TTS rendering, scoring, SRS scheduling, notifications.
- **Caching:** Redis (read-through for hot content, session/rate-limit counters, leaderboards).

**Bounded modules (domains):**
`auth` · `users` · `content` (courses/units/lessons) · `vocabulary` · `grammar` · `listening` · `reading` · `speaking` · `pronunciation` · `conversation` · `ai-teacher` · `srs` · `planner` · `progress` · `gamification` · `exams` (toeic/ielts) · `tracks` (business/kids) · `media` · `notifications` · `billing` · `analytics` · `ai` (orchestrator).

## 5. AI Layer

A dedicated **AI Orchestrator** module abstracts all model providers behind stable internal interfaces so providers can be swapped without touching domain code. Full detail in [AI_ENGINE.md](./AI_ENGINE.md).

| Capability                          | Primary Provider        | Model / Service                | Fallback                    |
| ----------------------------------- | ----------------------- | ------------------------------ | --------------------------- |
| Reasoning / AI Teacher / lesson gen | Anthropic Claude        | `claude-opus-4-8` (hard tasks) | `claude-sonnet-4-6`         |
| Conversation partner                | Anthropic Claude        | `claude-sonnet-4-6`            | `claude-haiku-4-5-20251001` |
| Fast grading / classification       | Anthropic Claude        | `claude-haiku-4-5-20251001`    | —                           |
| Speech-to-Text                      | Whisper / provider STT  | streaming transcription        | —                           |
| Text-to-Speech                      | ElevenLabs / Azure TTS  | natural voices                 | Azure ↔ ElevenLabs          |
| Pronunciation scoring               | Azure Speech Assessment | phoneme/word/prosody scores    | custom model                |
| Embeddings / semantic               | Embeddings API          | stored in **pgvector**         | —                           |

**Key rule:** the domain calls `AiPort.generateLesson()`, `SpeechPort.transcribe()`, etc. — never a vendor SDK directly. All calls are logged (tokens, cost, latency) and cached where deterministic.

## 6. Learning Engine — **CORE IMPLEMENTED (Sprint 3.1)**

The **Learning Engine** is the content-type-agnostic heart of the platform — one engine
for every lesson kind (not vocabulary/grammar-specific; see
[DECISIONS.md](./DECISIONS.md) D-0009). It lives in `src/modules/learning/` with strict
hexagonal layering (CLAUDE.md §3), mirroring the future `packages/learning-engine`:

```
src/modules/learning/
├── domain/          # entities, value objects (pagination), errors — framework-free
├── application/     # services (use cases) + ports (repository interfaces)
└── infrastructure/  # Prisma repositories, mappers, container (composition root)
Presentation:  src/app/api/v1/** (route handlers) · src/app/(dashboard)/learn/** (UI)
```

- **Dependencies point inward:** presentation → application (services) → ports;
  infrastructure implements ports. Route handlers and pages contain **no** business logic
  — they adapt HTTP/UI to services (D-0014).
- **Content model:** Course → Unit → Lesson → **LessonVersion** → Activity → Exercise →
  Question → (Choice | Answer), plus Difficulty, Tag, LessonDependency, LearningPath,
  LearningObjective. Content is **versioned** (D-0010) and **soft-deleted** (D-0015).
- **Services (Sprint 3.1 = interfaces + read skeletons):** `CourseService`,
  `LessonService`, `ExerciseService`, `QuestionService`, `LearningPathService`,
  `ProgressService` (contract-only → 501).

**Pedagogy layer (deterministic, later epics)** builds on this core:

- **SRS Scheduler** (FSRS), **Daily Planner**, **Weakness Detector**, **Adaptive
  Sequencer**, **Mastery Model** — deterministic and testable without AI. The engine
  consumes AI outputs (generated lessons, scores) but its scheduling logic never depends
  on AI.

## 7. Database

- **Primary:** PostgreSQL 16 with **pgvector** extension.
- **ORM:** Prisma (typed, migration-driven). Schema is the source of truth; see [DATABASE.md](./DATABASE.md).
- **Cache/Queue/Realtime:** Redis (cache, BullMQ, pub/sub, rate limiting, leaderboards).
- **Search (later):** OpenSearch/Meilisearch for content discovery if needed.
- **Read scaling:** read replicas + partitioning of hot append-only tables (`analytics_events`, `srs_reviews`, `ai_usage_logs`) by time.
- **IDs:** UUID v7 (time-sortable) as primary keys.

## 8. Storage

- **Object storage:** S3-compatible (AWS S3 or Cloudflare R2) for audio (lessons, TTS, learner recordings), images, and generated media.
- **CDN:** in front of public media (CloudFront / Cloudflare CDN).
- **Access:** short-lived signed URLs; learner recordings are private by default.
- **Lifecycle:** transient learner recordings expire (e.g., 30–90 days) unless retained for progress; generated TTS cached and deduplicated by content hash.

## 9. Authentication & Authorization — **IMPLEMENTED (Sprint 2.1)**

> Implemented with **Supabase Auth** ([ADR-0001](./adr/ADR-0001.md)) on a
> **Supabase-Auth-centric identity model** ([ADR-0002](./adr/ADR-0002.md)). Supabase
> owns credentials/OAuth/verification/tokens; our `public` schema owns identity + RBAC.

**Authentication (AuthN)**

- **Supabase Auth** — email/password with email verification; OAuth-ready. No app-side
  password storage (Supabase handles hashing).
- **Sessions:** cookie-based via `@supabase/ssr` (httpOnly, `secure` in prod, `sameSite=lax`,
  chunked). Rotated/refreshed automatically in `middleware.ts` on every request
  (`supabase.auth.getUser()` — revalidated, not trusted from `getSession`).
- **Flows** are Next.js **Server Actions** (`src/lib/auth/actions.ts`) + a
  `/auth/callback` PKCE code-exchange route. `user_sessions` mirrors sessions (token
  **hash** only) for audit + "log out everywhere".

**Authorization (AuthZ) — permission-based RBAC**

- Atomic **permissions** (`<resource>.<action>`) bundled into **roles**
  (admin/teacher/content_manager/student) via `role_permissions`; users hold roles via
  `user_roles`. **No role-name checks in code** — always `hasPermission(...)`.
- The RBAC catalog + default mapping live in `src/lib/auth/permissions.ts` (seeded to DB).
- **Two-layer enforcement:**
  1. **Edge middleware** (`src/middleware.ts`) — authentication gate on `/dashboard`,
     `/profile`, `/settings`, `/admin` (no DB on Edge).
  2. **Node runtime** — `requireUser()` / `requirePermission()` in layouts/pages resolve
     roles+permissions from the DB (e.g. `/admin` needs `admin.panel_access`).

**Security strategies (Sprint 2.1)**

- **Rate limiting** — sliding-window limiter (`src/lib/security/rate-limit.ts`) on auth
  actions (login 5/min, sign-up 3/min, reset/resend 3/15min); in-memory default with a
  pluggable store interface (inject Redis/Upstash in production).
- **CSRF** — Next.js Server Actions are POST-only and Origin-checked (built-in
  protection); the callback route validates a local-only `next` (no open redirect).
- **Cookies** — Supabase SSR cookie strategy (httpOnly/secure/sameSite); no tokens in JS.
- **Environment validation** — zod-validated env (`src/lib/env.ts`), non-throwing with
  `isSupabaseConfigured` / `isDatabaseConfigured` flags and an auth-path `assert`.
- **Audit** — `audit_logs` records sign-up/login/logout/reset/verify + role changes.
- **Enumeration-safe** — forgot-password always returns success.
- **Kids:** parental gating, restricted social features, COPPA/GDPR-K (later epics).

_See security rules in [CLAUDE.md](./CLAUDE.md) §9._

## 10. Deployment

> **Current (Stage 0):** the single Next.js app deploys to **Vercel** (web) with a
> **Railway** container path (Dockerfile, standalone output) available for the future
> worker; Postgres via **Supabase**. The Kubernetes/multi-service model below is the
> **target** for after the service split ([ARCHITECTURE_EVOLUTION.md](./ARCHITECTURE_EVOLUTION.md)).

- **Containers:** Docker images per service; **Kubernetes** for orchestration (HPA autoscaling).
- **Environments:** `local` → `dev` → `staging` → `production`, each isolated with its own DB.
- **CI/CD:** GitHub Actions — lint, type-check, test, build, migrate (guarded), deploy. Trunk-based with preview environments per PR.
- **Infra as Code:** Terraform for cloud resources.
- **Frontend:** Vercel (or containerized Next.js) with edge caching.
- **Rollouts:** blue/green or canary; DB migrations are backward-compatible (expand/contract).
- **Observability:** OpenTelemetry traces, Sentry (errors), Prometheus + Grafana (metrics), structured JSON logs, alerting on SLOs.

## 11. Folder Architecture

> Reflects the **actual** implementation. The MVP is a **single Next.js app at the
> repo root** ([ADR-0001](./adr/ADR-0001.md)); the `apps/` + `packages/` monorepo is
> **reserved scaffolding** for a future, evidence-triggered split
> ([ARCHITECTURE_EVOLUTION.md](./ARCHITECTURE_EVOLUTION.md)).

### 11.1 Current layout (Stage 0 — single app at root)

```
english-ai/
├── docs/                     # documentation + docs/adr/ (decision records)
├── prisma/                   # schema.prisma (+ migrations from Sprint 2)
├── public/                   # static assets
├── src/
│   ├── app/                  # Next.js App Router (UI + Route Handlers/BFF)
│   │   ├── (auth)/login, (dashboard)/dashboard, api/health, layout, page
│   ├── components/           # ui/ (shadcn primitives) + theme provider/toggle
│   ├── config/               # site config
│   └── lib/                  # domain-light: utils, env, prisma, supabase/*
├── apps/                     # RESERVED (README-only): web, worker
├── packages/                 # RESERVED (README-only): shared, ui, ai, database,
│                             #                         learning-engine, srs
├── reports/                  # sprint reports
├── .github/workflows/        # CI
├── Dockerfile · docker-compose.yml · railway.json · vercel.json
└── package.json · tsconfig.json · tailwind.config.ts · next.config.mjs
```

### 11.2 Target layout (reserved — post-split)

```
english-ai/
├── apps/
│   ├── web/                  # Next.js UI + thin BFF (moved from root)
│   ├── worker/               # BullMQ consumers (AI gen, TTS, scoring, SRS, notifs)
│   ├── realtime/             # (future) WebSocket conversation/speaking
│   └── mobile/               # (future) Expo / React Native
├── packages/
│   ├── shared/               # types, DTOs/Zod, constants, pure utils
│   ├── ui/                   # design system (shadcn) + tokens
│   ├── database/             # Prisma schema/client + repositories
│   ├── ai/                   # provider-agnostic AI ports + prompts
│   ├── learning-engine/      # deterministic pedagogy (planner, adaptive, mastery)
│   └── srs/                  # FSRS scheduler (pure)
├── infra/                    # IaC, container/deploy manifests
└── prisma/ → packages/database
```

**Domain module internal layout (hexagonal) — applies within `src/modules` today and
within packages/apps after the split:**

```
<domain>/
├── application/      # use cases (services), ports (interfaces)
├── domain/          # entities, value objects, domain services (framework-free)
├── infrastructure/  # prisma repositories, provider adapters
└── interface/       # route handlers / server actions / (future) controllers, DTOs
```

**Migration to 11.2 is a move + wire-up, not a rewrite** — triggers and effort in
[ARCHITECTURE_EVOLUTION.md](./ARCHITECTURE_EVOLUTION.md) §4.

## 12. Scalability Strategy

| Concern           | Strategy                                                                       |
| ----------------- | ------------------------------------------------------------------------------ |
| Traffic growth    | Stateless app pods behind LB; K8s HPA on CPU/RPS                               |
| Slow AI/media     | Async workers + queue; user gets job status, not a blocked request             |
| DB read load      | Read replicas, Redis cache, query/index discipline                             |
| Hot append tables | Time-partitioning + archival for events/logs/reviews                           |
| Cost control      | Model tiering (Haiku→Sonnet→Opus), prompt caching, TTS dedup, response caching |
| Content scale     | CDN + signed URLs; content versioning; lazy generation                         |
| Team scale        | Bounded modules → independent ownership → extractable to services              |
| Global latency    | Multi-region edge for static + regional API where needed                       |
| Realtime scale    | Socket.IO with Redis adapter; sticky-free via pub/sub                          |

**Extraction triggers:** a module becomes its own service when it has an independent scaling profile or failure domain — the **AI worker pool** and **media/TTS pipeline** are the first candidates.

---

_Cross-references:_ data model → [DATABASE.md](./DATABASE.md); endpoints → [API.md](./API.md); rules that enforce this architecture → [CLAUDE.md](./CLAUDE.md).
