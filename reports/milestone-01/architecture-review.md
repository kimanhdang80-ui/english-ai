# Milestone 1 — Architecture Review

## Boundaries & layering (hexagonal — CLAUDE.md §3)

- **Domain stays pure.** New domain types (`AiUsageLogEntry`, `AiCapability`) are
  framework-free; no vendor imports leaked inward.
- **Application depends on ports.** `AiTextService` depends on `LlmPort`,
  `PromptTemplateRepository`, `AiUsageLogRepository`, and existing services — never on a
  concrete provider or Prisma.
- **Infrastructure implements ports.** Providers, the Prisma/no-op usage-log repos, and the
  daily-loop `AiExplanationAdapter` live in `infrastructure/`. Vendor HTTP is confined here.
- **Provider abstraction respected.** `AIProvider` is structurally `LlmPort`; the vendor SDK
  rule ("never call a vendor SDK from feature code") holds — features call `ai.text`/`ai.generator`.
- **Model ids centralized.** All ids remain in `config/models.ts` (+ `OPENAI_MODELS`,
  `DEFAULT_MODEL_BY_PROVIDER`); none hardcoded in adapters or services.

## SOLID / DDD

- **SRP:** each provider does transport; each decorator does one concern (retry, fallback);
  `AiTextService` does capability orchestration; repos do persistence. Clean separation.
- **OCP:** adding Gemini = one adapter + one factory `case`; adding a capability = one
  template + one method. No edits to existing providers.
- **LSP:** decorators and adapters are interchangeable `AIProvider`s (delegating
  `providerName`/`configured`).
- **DIP:** high-level services depend on the `LlmPort` abstraction; the factory injects the
  concrete chain at the composition root.

## Drift check

- No new architectural layer or module was introduced — the provider layer is an
  `infrastructure/providers` sub-package of the existing `ai` module. ✅
- Cross-module use is via a **public service** (`daily-loop` → `ai.text`), not internals. ✅
- One deliberate, documented decision: usage logging lives in the capability service (has
  `feature`/`userId`), not a provider decorator (D-0032). ✅

## Verdict

**No architecture drift.** The change is additive adapters + decorators behind existing
ports, plus one gated table. Boundaries and dependency direction are intact.
