# SPRINT 7.1 REPORT — AI Lesson Generator Foundation

- **Epic:** 7 — AI Lesson Generator
- **Sprint:** 7.1 (foundation)
- **Date:** 2026-07-01
- **Status:** ✅ Complete — typecheck · lint · **test (50)** · build all green
- **Constraint honored:** **no OpenAI/Claude call**, no AI SDK dependency; only the
  provider-agnostic framework was built (`LlmPort` stub → 501).
- **Process:** full [PROJECT_OS.md](../docs/PROJECT_OS.md) lifecycle; governance reports in
  [`reports/sprint-07.1/`](./sprint-07.1/).

---

## 1. What was built (`src/modules/ai`, hexagonal)

**Domain (pure, framework-free)**

- `entities.ts` — PromptTemplate, PromptVariable, PromptVersion, GenerationRequest,
  GenerationResult, GenerationRecord, ValidationReport/Issue, DifficultyProfile,
  LlmRequest/Completion + enums.
- `PromptRenderer` (`{{VAR}}` substitution + missing detection), `estimateTokens`,
  `ContentValidator` (empty / too-long / wrong-format / missing-key),
  `DifficultyAdjuster` (CEFR → constraints).

**Application**

- Ports: `LlmPort`, `PromptTemplateRepository`, `GenerationHistoryRepository`.
- Services: `LessonGeneratorService` (AI-free `preview()` + `generate()` via the port),
  `PromptBuilder`, `ContentValidatorService`, `DifficultyService`, `TokenEstimator`,
  `PromptVersionService` (reads + write skeletons → 501).

**Prompt system (data, not inline)**

- `config/prompt-templates.ts` — versioned registry (`vocabulary-lesson`,
  `grammar-explanation`) using `{{WORD}} {{TOPIC}} {{LEVEL}} {{LANGUAGE}} {{GOAL}} {{STYLE}}`.
- `config/models.ts` — model-id registry (only place model ids live).

**Infrastructure**

- `InMemoryPromptTemplateRepository` (seeded from the registry), `InMemoryGenerationHistoryRepository`,
  **`StubLlmAdapter`** (`configured=false`, `complete()` → NotImplementedError), container.

**UI placeholders (admin, permission-gated)**

- `/admin/prompts` (Prompt Library), `/admin/generator` (Generator),
  `/admin/prompt-versions` (Prompt Versions), `/admin/generation-history` (History) + admin sub-nav.

## 2. Validation coverage (as required)

| Requirement         | Where                              | Behaviour                                                    |
| ------------------- | ---------------------------------- | ------------------------------------------------------------ |
| Prompt empty        | `ContentValidator.validatePrompt`  | `EMPTY_PROMPT` error                                         |
| Variable missing    | `PromptBuilder` + `PromptRenderer` | `missingRequired` → `ValidationError`; token left unresolved |
| Output too long     | `ContentValidator.validateOutput`  | `OUTPUT_TOO_LONG` vs token budget                            |
| Output wrong format | `ContentValidator.validateOutput`  | `INVALID_FORMAT` / `MISSING_KEY` (json)                      |

## 3. Verification

| Check       | Command                | Result                     |
| ----------- | ---------------------- | -------------------------- |
| Type safety | `npm run typecheck`    | ✅                         |
| Lint        | `npm run lint`         | ✅                         |
| Format      | `npm run format:check` | ✅                         |
| Tests       | `npm run test`         | ✅ **50 passed** (7 files) |
| Build       | `npm run build`        | ✅ (4 AI admin routes)     |

New tests (+16): `prompt-renderer.test.ts`, `content-validator.test.ts`,
`lesson-generator-service.test.ts` (preview happy path, missing-var → ValidationError,
unknown template → NotFound, generate → NotImplemented + no history written).

## 4. Key decisions ([DECISIONS.md](../docs/DECISIONS.md) D-0022…D-0024)

- Provider-agnostic; stub adapter; no AI call.
- Prompts are versioned **data**; model ids centralized.
- In-memory skeleton repos — **no DB change** (persistence needs the DB gate).

## 5. Gate compliance

- **No DB change** this sprint (in-memory repos) — so the DB gate did not trigger.
- **No API added** — UI reads services directly; REST `/api/v1/ai/*` is gated to Sprint 7.2.
- **No ADR required** — this implements the documented AI Layer (AI_ENGINE.md,
  SYSTEM_ARCHITECTURE §5); not an architecture change.

## 6. Debt movement

- **NEW:** DEBT-014 (provider adapter + AI persistence via DB gate), DEBT-015 (dedicated
  `ai.generate` permission).

## 7. Remaining work (→ Sprint 7.2)

Real provider adapter (env-gated), Prisma persistence (DB gate), `ai.generate` permission,
`/api/v1/ai/*` (API gate), working Generator UI + history, output-schema validation. See
[NEXT_TASK.md](../docs/NEXT_TASK.md).
