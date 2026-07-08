# Architecture Score — English AI

> Review-only. Scope: architecture/layering, folder structure, cross-module coupling, code
> duplication, naming, technical-debt hygiene, scalability posture. Cross-ref:
> [beta-readiness](./beta-readiness.md), [refactor-roadmap](./refactor-roadmap.md). No code changed.

## Scores

| Dimension               | Score | Justification                                                                                      |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| Architecture / Layering | 9/10  | Zero framework/ORM/vendor imports in any `domain`/`application` layer; container-only composition. |
| Folder Structure        | 9/10  | 4 modules share an identical layered shape; co-located tests; focused files.                       |
| Cross-Module Coupling   | 8/10  | Runtime deps via public containers; one cross-module _domain_ import (pagination).                 |
| Code Duplication        | 6/10  | Provider `complete()` + `safeErrorDetail` duplicated across two adapters.                          |
| Naming                  | 9/10  | CLAUDE.md conventions consistently applied; no dumping-ground utils.                               |
| Technical-Debt Hygiene  | 7/10  | Excellent ledger; some live skeletons + one dead file.                                             |
| Scalability Posture     | 3/10  | In-memory stores in prod containers; no Redis/CDN/queue (see performance-audit).                   |

**Design-time architecture average ≈ 8.1/10** (excludes run-time scalability, scored separately).

## What's done well (verified)

- **Hexagon purity holds project-wide.** Grep for `@prisma`, `next`, `@supabase`, `react`,
  `server-only` in `**/{domain,application}/**` → **no matches**. This is the hardest guarantee
  and it actually holds.
- **Composition roots isolated** to one `infrastructure/container.ts` per module, all `server-only`.
  Pages/routes consume the exported container object only; presentation stays thin (parse →
  delegate → format).
- **AI provider layer is exemplary** — `AIProvider` is a structural `LlmPort` seam; resilience is
  layered as decorators (`RetryingProvider`, `FallbackProvider`); selection is config-driven via
  `ProviderFactory` with a `never` exhaustiveness guard; no vendor SDK (raw `fetch`, injected keys).
- **DEBT-005 (mapping dup) genuinely resolved** — single `toReviewCard` in `mappers.ts`, reused.
- **No `TODO`/`FIXME` anywhere** — incomplete work is either an explicit `NotImplementedError`
  skeleton or a ledger entry.

## Findings

| ID      | Severity | Location                                                                                                                                                                                    | Issue                                                                                                                | Recommendation                                                             | Priority |
| ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------- |
| ARCH-01 | Med      | `vocabulary/application/{ports,services}`, `infrastructure/repositories`, `api/v1/vocabularies/route.ts`, `(dashboard)/vocabulary/page.tsx` (import `@/modules/learning/domain/pagination`) | DEBT-006 confirmed and **wider than logged** — a cross-module _domain_ import spanning 5 files incl. presentation.   | Promote pagination to a shared kernel `src/lib/pagination.ts`.             | Medium   |
| ARCH-02 | Med      | `claude-provider.ts` + `openai-provider.ts`                                                                                                                                                 | `safeErrorDetail` byte-identical; whole `complete()` fetch/timeout/abort scaffold near-identical.                    | Extract `HttpLlmProvider` base / `fetchWithTimeout` + shared helper.       | Low      |
| ARCH-03 | Med      | `src/modules/ai/infrastructure/stub-llm-adapter.ts`                                                                                                                                         | Dead in production — replaced by `ProviderFactory`/`UnconfiguredProvider`; only a test references it.                | Delete prod file; repoint test to `UnconfiguredProvider`; add ledger note. | Low      |
| ARCH-04 | Med      | `learning/application/services/progress-service.ts`, `ai/application/services/prompt-version-service.ts`                                                                                    | Skeleton services still throw `NotImplementedError` (progress 501; prompt draft/publish 501).                        | Keep documented; schedule (DEBT-009/014); don't expose in beta UI.         | Medium   |
| ARCH-05 | Low      | `daily-loop/application/ports.ts`, `domain/entities.ts` (import vocabulary domain types)                                                                                                    | Second cross-module _domain_ type dependency (`ReviewCard`/`QuizItem`/`QuizQuestion`) — shared types, not internals. | Acceptable; note alongside ARCH-01 for a future shared kernel.             | Low      |
| ARCH-06 | Low      | `claude-provider.ts` (API URL/version file-local consts)                                                                                                                                    | Provider endpoint constants live in the adapter while model ids live in `config/models.ts` — minor split.            | Consider centralizing provider endpoints in config for consistency.        | Low      |
| ARCH-07 | Info     | intended `presentation/` folder                                                                                                                                                             | Route handlers live in `src/app` (Next convention), not a module `presentation/` folder as docs imply.               | Document the convention in SYSTEM_ARCHITECTURE; no move needed.            | Low      |

## Coupling map (as-built)

```
presentation (app/) ──▶ module containers (vocabulary/ai/daily-loop/learning)
daily-loop ──▶ vocabulary.container (public) ✅   ──▶ ai.container (public) ✅
vocabulary ──▶ learning/domain/pagination  ⚠️ (ARCH-01, cross-module domain)
daily-loop ──▶ vocabulary/domain types     ⚠️ (ARCH-05, shared types)
domain/application layers ──▶ (no framework/ORM/vendor) ✅
```

## Verdict

Architecture is a **genuine strength and the project's best asset** — the layering discipline is
real, not aspirational. The only structural debt is a generic type (pagination) living in the wrong
module and minor provider duplication. Scalability posture is low purely because production
containers still wire in-memory skeletons (tracked, DB-gated) — an _operational_, not _design_, gap.
