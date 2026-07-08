# CLAUDE.md — English AI Engineering Rulebook

> **Permanent, binding engineering rules.** This is the constitution. Every PR,
> human or AI, must comply. When a rule conflicts with speed, the rule wins —
> we never simplify architecture merely to save implementation time.
> Changes to this file require explicit review and a CHANGELOG entry.
>
> **Process:** CLAUDE.md is the **craft** (how to write code). The **lifecycle** (how a
> sprint is planned, gated, verified, and recorded) is governed by
> [PROJECT_OS.md](./PROJECT_OS.md) — the Development Operating System. Both are binding.

---

## 0. Prime Directives

1. **Scalability, maintainability, and clean architecture over short-term speed.**
2. **Read before you write.** Before adding anything, read the relevant docs (`PRODUCT`, `SYSTEM_ARCHITECTURE`, `DATABASE`, `API`, `AI_ENGINE`, `UI_GUIDELINE`, `DECISIONS`, `PROJECT_OS`) and existing code. Match existing patterns.
3. **Specification is supreme.** `specs/**` and `docs/` are authoritative. If code and spec/docs disagree, **fix the code**, not the spec — spec changes are a deliberate, gated act ([PROJECT_OS.md](./PROJECT_OS.md) §5).
4. **Log, don't fix (out-of-scope issues).** Discovered smells/debt/drift/dup/dead code/naming/perf/security are recorded in [`reports/technical-debt.md`](../reports/technical-debt.md) + [`docs/REFACTOR_PLAN.md`](./REFACTOR_PLAN.md), not fixed inline ([PROJECT_OS.md](./PROJECT_OS.md) §7).
5. **Gates before changes.** DB changes need ADR + impact + migration + rollback; API changes need spec + impact + docs — _before_ implementation ([PROJECT_OS.md](./PROJECT_OS.md) §4, §5).
6. **Leave it better.** Every change respects boundaries; no shortcuts that create untracked tech debt.

## 1. Coding Standards

- **Language:** TypeScript everywhere, `strict: true`. **No `any`** (use `unknown` + narrowing); no non-null `!` without justification.
- **Style:** enforced by ESLint + Prettier; CI fails on violations. No disabling rules inline without a comment explaining why.
- **Functions:** small, single-responsibility, pure where possible. Guard clauses over deep nesting.
- **Errors:** never swallow. Throw typed domain errors; handle at boundaries; user-facing messages are safe and localized.
- **Immutability:** prefer `const` and immutable data; avoid shared mutable state.
- **Async:** always handle rejections; no floating promises; use the job queue for slow work.
- **Comments:** explain _why_, not _what_. Match surrounding comment density. No dead/commented-out code.
- **Dependencies:** justify new deps (size, maintenance, security); prefer the platform/stdlib; pin versions.

## 2. Naming Rules

| Thing                          | Convention                 | Example                               |
| ------------------------------ | -------------------------- | ------------------------------------- |
| Files/dirs                     | kebab-case                 | `daily-planner.service.ts`            |
| Classes/Types/Interfaces/Enums | PascalCase                 | `SrsScheduler`, `LlmPort`             |
| Variables/functions            | camelCase                  | `computeNextDue`                      |
| Constants                      | UPPER_SNAKE                | `MAX_DAILY_REVIEWS`                   |
| React components/files         | PascalCase                 | `FlashCard.tsx`                       |
| DB tables/columns              | snake_case (plural tables) | `srs_cards`, `due_at`                 |
| API routes/resources           | kebab-case, plural         | `/vocabulary/decks`                   |
| Booleans                       | is/has/can/should prefix   | `isPublished`                         |
| Env vars                       | UPPER_SNAKE, namespaced    | `DATABASE_URL`, `AI_PROVIDER_API_KEY` |

Names are descriptive and unabbreviated (except well-known: `id`, `url`, `db`). No misleading names.

## 3. Architecture Rules

- **Hexagonal boundaries:** `domain` (framework-free) ← `application` (use cases, ports) ← `infrastructure` (adapters) / `interface` (controllers). Dependencies point **inward only**.
- **Domain purity:** domain code imports no framework, ORM, HTTP, or vendor SDK.
- **Provider abstraction:** all external services (LLM, STT, TTS, scoring, payments, storage) behind **ports**; adapters are swappable. **Never call a vendor SDK from feature code.**
- **Module boundaries:** cross-module access via public services/APIs, not by reaching into another module's internals or tables.
- **AI model IDs** live only in `packages/ai` config — never hardcoded in features.
- **No business logic in controllers or React components.** Controllers validate + delegate; components render + call the SDK.
- **Configuration** via env/config module, validated at boot (fail fast). No secrets or magic values in code.
- **Backward-compatible DB migrations** (expand/contract); no destructive migrations without a two-phase plan.

## 4. Testing Rules

- **Pyramid:** many unit, fewer integration, few E2E. Coverage target **≥ 80%** on domain/application; critical paths (auth, billing, SRS, scoring) near 100%.
- **Deterministic first:** the SRS scheduler, planner, adaptive math, and scoring aggregation must be unit-tested **without AI/network**.
- **AI tests:** ports are mocked in unit tests; a separate **evaluation harness** (golden datasets) validates prompt/model quality and gates prompt changes.
- **No merge without green CI.** Tests run on every PR. New behavior ships with tests; bug fixes ship with a regression test.
- **Test quality:** test behavior, not implementation; no flaky/time-dependent tests (inject clocks); realistic fixtures/factories.
- **E2E** covers core learner journeys (onboard → lesson → review → conversation).

## 5. Git Rules

- **Trunk-based**, short-lived feature branches: `feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`.
- **Conventional Commits:** `type(scope): summary` (e.g., `feat(srs): add FSRS scheduler`).
- **Small, focused PRs** (< ~400 lines ideal); one concern per PR; descriptive body linking the sprint/issue.
- **Every PR:** passes CI, has tests, updates relevant docs + `CHANGELOG`/`PROJECT_STATE` when scope changes.
- **Review required** before merge; address or resolve every comment.
- **No force-push to shared branches**; no committing secrets, generated artifacts, or `.env`.
- **Migrations reviewed** with extra care; never edit a merged migration — add a new one.

## 6. Folder Rules

- Respect the monorepo layout in [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §11.
- Shared UI only in `packages/ui`; shared domain types in `packages/core`; API client only in `packages/sdk`; AI interfaces/prompts in `packages/ai`. **No cross-app relative imports** — use packages.
- Backend features follow the module layout (`application/domain/infrastructure/interface`).
- Co-locate tests (`*.spec.ts`) and stories (`*.stories.tsx`) with source.
- No dumping-ground `utils` files — name by purpose; keep files focused.

## 7. Documentation Rules

- **Docs are code.** Update the relevant `docs/*.md` in the same PR as the change it describes.
- **PROJECT_STATE.md** reflects current reality; **CHANGELOG.md** records every notable change; **NEXT_TASK.md** always points at the next unit of work.
- Public APIs documented in [API.md](./API.md); OpenAPI is generated and kept in sync (SDK derives from it).
- Every module has a short README (purpose, public surface, dependencies). Complex decisions get an ADR (`docs/adr/NNNN-*.md`).
- Comments and docs are written for the next engineer (or AI) with no context.

## 8. Refactoring Rules

- **Boy Scout Rule:** improve code you touch, but keep refactors separate from behavior changes (separate commits/PRs).
- Refactor only with test coverage in place first (characterization tests if needed).
- No speculative abstraction — abstract on the **third** repetition, not the first.
- Deleting is a feature: remove dead code; don't leave commented blocks.
- Large refactors are planned, incremental, and behind flags if risky.

## 9. Security Rules

- **Never trust input.** Validate & sanitize every external input at the boundary (DTO/Zod).
- **AuthN/AuthZ on every protected endpoint;** enforce ownership + RBAC — no implicit trust.
- **Secrets** only via vault/env; never in code, logs, or client bundles. Rotate keys.
- **Passwords** hashed with argon2id; tokens short-lived; refresh rotation + reuse detection.
- **Least privilege** for DB users, service accounts, cloud IAM.
- **Protect against** OWASP Top 10: parameterized queries (ORM), output encoding, CSRF for cookie flows, strict CORS, security headers, rate limiting.
- **PII & recordings** private by default (signed URLs); scrub PII before logging/AI prompts; honor deletion (GDPR) with cascading removal.
- **Kids:** minimized data, no behavioral ads, parental gating, restricted AI content.
- **Dependencies** scanned (SCA); patch known CVEs promptly. **Payments** via provider (PCI scope minimized) — never store raw card data.
- **AI safety:** moderate AI I/O; guard against prompt injection in user-supplied content; never expose keys or internal prompts to clients.

## 10. Performance Rules

- **Async for slow/costly work** (AI, TTS, scoring, email) — never block a request; return `202` + job.
- **DB discipline:** index every query path; no N+1 (batch/`include`); paginate all lists; keep transactions short.
- **Caching:** cache hot reads (Redis/CDN) with explicit invalidation; dedup TTS; cache deterministic AI generations; use prompt caching.
- **Payload hygiene:** return only needed fields; compress; use cursor pagination for feeds.
- **Frontend:** code-split, lazy-load, `next/image`, skeletons/optimistic UI, memoize hot components, minimize bundle; Core Web Vitals budgets in CI.
- **AI cost:** tier models (Haiku→Sonnet→Opus), enforce quotas, log usage; treat cost as a performance metric.
- **Set budgets & measure:** performance regressions are bugs; load-test before scale milestones.

---

### Enforcement

CI enforces lint, types, tests, coverage, and build. Human/AI review enforces the rest. A PR that violates a Prime Directive is rejected regardless of functionality. When in doubt, prefer the choice a principal engineer at a top-tier company would defend in 3 years.
