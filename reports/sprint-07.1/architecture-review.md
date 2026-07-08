# Sprint 7.1 — Architecture Review

## 1. Layering & boundaries

- Domain free of framework/provider SDKs? **Yes** — entities + pure services (renderer,
  validator, difficulty, token estimator); no imports of Next/Prisma/AI SDKs.
- Application depends only on ports? **Yes** — `LessonGeneratorService` depends on
  `LlmPort` + repository interfaces; the test wires in-memory repos + stub adapter.
- Infrastructure implements ports; presentation adapts only? **Yes** — repos + stub in
  `infrastructure/`; admin pages call the container, no logic in pages.

## 2. Module boundaries

- New coupling: the AI module reuses `@/lib/errors` (shared kernel) only. No dependency on
  vocabulary/learning modules. Clean.
- Mirrors the reserved `packages/ai` shape → future extraction is a move.

## 3. SOLID / DDD

- **SRP:** each service does one thing (build / render / validate / difficulty / estimate).
- **DIP:** the provider is an abstraction (`LlmPort`); the stub is one implementation, a
  real adapter another — swapped at the composition root only.
- **OCP:** adding a template = data in the registry; adding a provider = a new adapter —
  no change to domain/services.

## 4. Architecture drift

| Drift  | Where | Severity | Action |
| ------ | ----- | -------- | ------ |
| (none) | —     | —        | —      |

## 5. ADR check

- No ADR violated. **No new ADR required** — implements the documented AI Layer
  (AI_ENGINE.md, SYSTEM_ARCHITECTURE §5). The provider-abstraction decision already exists.
- DB persistence (future) **will** require the DB gate (ADR + migration + rollback).

## 6. Verdict

**Aligned ✅** — textbook ports-and-adapters; provider seam isolated; no drift.
