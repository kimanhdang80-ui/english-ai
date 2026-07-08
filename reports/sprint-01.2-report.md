# SPRINT 1.2 REPORT — Architecture Review & Consolidation

- **Sprint:** 1.2 — Rà soát và củng cố kiến trúc nền tảng
- **Date:** 2026-07-01
- **Status:** ✅ Complete — typecheck, lint, format, build all green
- **Scope rule honored:** **no business/learning features** were written.

---

## 1. Objective

Not to add features, but to **harden the architecture for multi-year scale**: review
the Next.js full-stack decision, prepare the future monorepo structure, standardize
decision records, and make the current-vs-target architecture explicit and evidence-driven.

---

## 2. Next.js full-stack — review (pros / cons / vs monorepo)

### Pros of the current single Next.js app

- **Fastest path to a shippable MVP** — one deployable, one language boundary, one CI.
- **Lower ops cost** — no inter-service auth/session plumbing, no cluster to run.
- **Managed auth** (Supabase) reduces security surface and custom code.
- **Great DX** — Server Components/Actions + Route Handlers cover UI and API in one repo.
- **Vercel-native** — previews per PR, edge caching, zero infra to babysit.

### Cons / limits

- **Async & long-running work** (AI generation, TTS, scoring) doesn't fit the request
  model — needs a queue/worker eventually.
- **Realtime (WebSocket)** streaming isn't a natural fit for serverless.
- **Coupled scaling/deploy** — UI and API scale and ship together.
- **Discipline risk** — business logic can leak into route handlers/components without
  guardrails.

### Comparison with a full monorepo (web + api + packages) now

| Dimension            | Single Next.js app (chosen) | Monorepo web + NestJS api + packages |
| -------------------- | --------------------------- | ------------------------------------ |
| Time to MVP          | ✅ Fastest                  | ❌ Slower (2 runtimes, wiring)       |
| Ops complexity       | ✅ Low                      | ❌ Higher (2 deploys, infra)         |
| Service isolation    | ⚠️ None yet                 | ✅ Hard boundary from day 1          |
| Independent scaling  | ❌ Not yet                  | ✅ Yes                               |
| Async/worker fit     | ⚠️ Needs later extraction   | ✅ Natural                           |
| Team ownership seams | ⚠️ Module-level only        | ✅ Deploy-level                      |
| Cost at MVP scale    | ✅ Lower                    | ❌ Higher for no benefit yet         |

**Conclusion:** the monorepo's advantages (isolation, independent scaling, worker fit)
have **no payoff at current scale** and cost real time/ops. The single-app choice is
**retained**.

### Retention condition — extraction without a big refactor

The decision is kept **only because** we made the future split cheap:

1. **Boundaries first, deploys later** — domain code is framework-light with
   inward-pointing dependencies (CLAUDE.md §3), written as if already packaged.
2. **Reserved scaffolding created** (`apps/*`, `packages/*` with READMEs) documents the
   destination, so extraction is a **move + wire-up**, not a redesign.
3. **State is external** (Postgres/Redis/object storage), so apps stay stateless and
   splittable without shared-memory assumptions.
4. **Objective triggers** for each split are pre-defined in `ARCHITECTURE_EVOLUTION.md`
   — the first likely split is **`apps/worker`** at Sprint 17–22 (AI + speech).

---

## 3. What was created / changed

### Expansion scaffolding (reserved, README-only)

```
apps/
├── web/            worker/
packages/
├── shared/  ui/  ai/  database/  learning-engine/  srs/
```

Each directory has a README stating its purpose, dependencies, and promotion trigger.
The live app remains at the repo root; these are **placeholders**, not populated.

### ADR standardization

- Unified template adopted: **Context · Decision · Alternatives · Consequences ·
  Future Review**.
- `adr/0001-nextjs-fullstack-supabase.md` → **`adr/ADR-0001.md`** (rewritten to the
  template; all 4 references updated).
- New **`docs/adr/README.md`** — process, template, status values, and an index.

### New/updated documentation

- **`docs/ARCHITECTURE_EVOLUTION.md`** — Stage-0 current architecture, target end
  state, migration milestones (M-A…M-E), and a decision-criteria table with thresholds.
- **`SYSTEM_ARCHITECTURE.md`** — §11 split into **11.1 current** (single app at root) +
  **11.2 target** (reserved monorepo); §10 marks current vs target deployment.
- Updated **PROJECT_STATE.md**, **CHANGELOG.md**, **NEXT_TASK.md**.

---

## 4. Architecture (current, restated)

```
Browser ─▶ Next.js app (Vercel): RSC UI · Route Handlers (BFF) · Server Actions
                 │                         │
          Supabase Auth            Prisma ─▶ PostgreSQL (Supabase)

apps/*, packages/*  ── reserved placeholders for the evidence-triggered split
```

Full detail: [SYSTEM_ARCHITECTURE.md](../docs/SYSTEM_ARCHITECTURE.md) §11.1 and
[ARCHITECTURE_EVOLUTION.md](../docs/ARCHITECTURE_EVOLUTION.md).

---

## 5. When we split (summary of criteria)

Split when **≥ 1** signal is measured (thresholds in ARCHITECTURE_EVOLUTION.md §5):

- Route Handler p95 > 3 s, or any sync path > 10 s → worker.
- A workload must run out-of-band (retryable / scheduled / > 10 s) → worker.
- Serverless cost of long AI calls > worker hosting → worker.
- WebSocket realtime concurrency/latency unmet on Vercel → realtime service.
- DB CPU > 70% sustained or hot table > ~50–100M rows → read replicas / partitioning.
- A second client (mobile) needs shared domain code → populate `packages/*`.

**Anti-trigger:** never split for "best practice", code size, or hypothetical future
scale.

---

## 6. Verification

| Check       | Command                | Result                        |
| ----------- | ---------------------- | ----------------------------- |
| Type safety | `npm run typecheck`    | ✅ 0 errors                   |
| Lint        | `npm run lint`         | ✅ clean                      |
| Format      | `npm run format:check` | ✅ clean                      |
| Build       | `npm run build`        | ✅ success (unchanged routes) |

No source/config code changed in this sprint — only docs and reserved README
placeholders — so runtime behavior is identical to Sprint 1.

---

## 7. Remaining work (unchanged) → Sprint 2

Database & Domain Foundations: provision Postgres, expand schema, migrations + seed,
**repository layer authored for future `packages/database`**, add Vitest + Postgres in
CI. See [NEXT_TASK.md](../docs/NEXT_TASK.md).
