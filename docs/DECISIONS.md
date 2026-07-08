# DECISIONS.md — Engineering Decision Log

> A lightweight, chronological log of **notable engineering decisions** that are
> smaller than a full [ADR](./adr/) but worth recording. ADRs cover big,
> hard-to-reverse choices; this file captures the day-to-day "why we did it this way".
> Newest first. Link to ADRs when a decision graduates to one.

---

## Milestone 1 — Real AI (provider integration)

### D-0029 · `AIProvider` = adapters behind the existing `LlmPort` (no new architecture)

Real providers are **adapters**, not a new abstraction. `AIProvider` is structurally the
Sprint-7.1 `LlmPort`, so `ClaudeProvider`/`OpenAIProvider` drop straight into the container.
Resilience is **composed with decorators** (`RetryingProvider`, `FallbackProvider`) that
also implement the interface — transparent to services. Full rationale: [ADR-0003](./adr/ADR-0003.md).

### D-0030 · Provider calls via `fetch`, not vendor SDKs

Adapters call the Anthropic Messages and OpenAI Chat APIs over `fetch` — zero new
dependencies, full control of timeout/abort, tiny surface. Revisit SDKs only if we need
streaming/tool-use ergonomics. Keys are injected from config, never read in the adapter,
never logged.

### D-0031 · Config-driven selection; capability-level graceful fallback

`ProviderFactory.create()` reads `aiEnv` (env) to pick provider + build the chain, so
switching providers is a one-line env change. If the provider is unconfigured or fails,
`AiTextService` returns a **deterministic fallback** (and logs `fallback`/`failed`) so the
learning loop never breaks — AI is strictly additive.

### D-0032 · Usage logged at the capability layer, not the provider

`ai_usage_logs` writes happen in `AiTextService` (which knows the `feature` + `userId`),
not in a provider decorator (which knows neither). Logging is fire-and-forget and
swallowed on error; persisted via Prisma only when a DB is configured, else a no-op sink.
The daily-loop explanation source becomes `ai` (real) when configured, else `mock`.

---

## Sprint 8.1 — Daily Learning Loop (MVP)

### D-0025 · Daily loop is a composition module, not new framework

`src/modules/daily-loop` **composes** vocabulary (via a `LessonSourcePort`) + a mock
explanation port into the daily experience. No new persistence, no new infrastructure —
it reuses existing services. Cross-module reads go through a narrow port so the loop stays
testable and decoupled.

### D-0026 · AI explanation behind a swappable `ExplanationPort` (mock now)

Quiz explanations come from a `MockExplanationAdapter` (rule-based, no AI). A real AI
adapter implements the same `ExplanationPort` later — zero service changes. Satisfies "tạm
dùng mock" while keeping the AI seam.

### D-0027 · Streak & activity DERIVED from `review_history` (no new table)

Streak and recent activity are computed from the existing `review_history` (distinct days
/ per-day counts) — **no schema change**, so the DB gate is not triggered. Review-queue
statuses (NEW/LEARNING/REVIEW/MASTERED) are a **presentation mapping** over SRS state, not
a stored column.

### D-0028 · Learning-session persistence deferred (skeleton)

Per-session records (time/score/completion) use an in-memory `SessionRepository` skeleton;
real persistence needs a `learning_sessions` table via the DB gate (DEBT-016). The session
summary is shown client-side immediately.

---

## Sprint 7.1 — AI Lesson Generator Foundation

### D-0022 · Provider-agnostic AI foundation, no provider call

The generator is built as ports + adapters (AI_ENGINE.md). Sprint 7.1 ships the domain,
services, prompt system, validation, and UI **without** calling OpenAI/Claude: the
`LlmPort` is implemented by a `StubLlmAdapter` that throws `NotImplementedError` (→ 501).
A real adapter drops in at the container with **zero** changes to domain/services. No AI
SDK dependency was added.

### D-0023 · Prompts are versioned DATA, never inline strings

Prompt bodies live in a **template registry** (`config/prompt-templates.ts`) as
`PromptTemplate` + `PromptVersion` with `{{VARIABLE}}` tokens; services only render via
`PromptRenderer`. Model ids live in `config/models.ts` only. This satisfies "Không
hard-code prompt" and mirrors the future `prompt_templates` table.

### D-0024 · In-memory skeleton repositories (no DB change this sprint)

Persistence for `prompt_templates` / `generation_history` (DATABASE.md §3.12) is a schema
change that requires the DB gate (PROJECT_OS §4). To keep the sprint a foundation, repos
are **in-memory** (template repo seeded from the registry; history ephemeral). Persistence
is tracked as debt and gated later.

---

## Sprint 4.1 — Vocabulary MVP

### D-0017 · Vocabulary is its own module, not the generic content tree

The Learning Engine (Epic 3) models generic lessons. Vocabulary has distinct shapes
(headword, meanings, IPA, audio, images) and per-learner SRS state, so it is a **separate
module** `src/modules/vocabulary` with the same hexagonal layering. It reuses shared
taxonomy (`CefrLevel`, `Tag`) — not a fork. No architecture change; same pattern as
`learning`.

### D-0018 · Deterministic SRS (SM-2 lite), no AI

Review scheduling is a **pure function** `schedule(state, rating, now)` in
`domain/srs.ts` (injected clock → unit-testable). Ratings `again|hard|good|easy` update
ease/interval/dueAt; status derives from interval (known ≥ 7d, mastered ≥ 30d). The
Flashcard's "Know"→`good` and "Review Again"→`again`. Progress/SRS satisfies the sprint
without any AI.

### D-0019 · Shared `DomainError` extracted to `src/lib/errors.ts`

So the vocabulary and learning modules (and the HTTP error mapper) share one error
hierarchy and a single `instanceof` check works across modules. `learning/domain/errors`
now re-exports it (back-compat). Small refactor, not an architecture change.

### D-0020 · `Answer`-style keys stay server-side; quiz grades on the client

`GET /questions` and the vocabulary API never return correct answers for review content.
The **practice quiz** is generated deterministically (`domain/quiz.ts`) and graded in the
browser — acceptable because it's low-stakes practice, not assessment. Real grading/
scoring (assessments) stays server-side in a later epic.

### D-0021 · Seed vocabulary is authored content (allowed)

Unlike earlier sprints (no demo data), Sprint 4.1 explicitly seeds ~60 real A1 words
(`prisma/data/a1-vocabulary.ts`) with Vietnamese translations — this is product content,
not throwaway demo data, and is required for the feature to be usable.

---

## Sprint 3.1 — Learning Engine Core

### D-0009 · The Learning Engine is content-type-agnostic

The engine models **generic** learning structures (Course → Unit → Lesson →
LessonVersion → Activity → Exercise → Question → Choice/Answer), **not** vocabulary or
grammar. Vocabulary/grammar/etc. become _content authored into_ this tree (later epics)
or specialized satellite tables that reference it — never forks of the engine. This is
the whole point of the sprint (one engine for all lesson kinds).

### D-0010 · Content versioning via `LessonVersion`

Activities/exercises/questions hang off a **`LessonVersion`**, not the `Lesson`
directly. `Lesson.currentVersionId` points at the published snapshot. Editing creates a
new draft version; publishing swaps the pointer. This gives safe edit-in-place, rollback,
and stable references for learner history — at the cost of one extra level of nesting.
Accepted: correctness/versionability outweighs the extra join.

### D-0011 · `Difficulty`, `Tag`, `Skill` are tables; `*Type` discriminators are enums

- **Data (tables):** `Skill`, `Difficulty`, `Tag`, `LearningObjective` — they grow,
  need metadata, and are referenced/queried. Modeling as data avoids hard-coding
  (CLAUDE.md) and lets non-engineers manage them.
- **Enums:** `ContentStatus`, `ActivityType`, `ExerciseType`, `QuestionType`,
  `DependencyType`, `PathStepType` — these are **structural discriminators** the code
  switches on to render/interpret content; they change only with a code release. Using
  enums here is type-safety, not business hard-coding.

### D-0012 · `Answer` = answer key, not user submissions

With no learner-data tables in scope, `Answer` models the **correct answer(s)** for a
question (`value`, `matchMode`, `isPrimary`); `Choice` models selectable options.
Learner submissions/attempts belong to the Progress domain (future sprint) and are
deliberately **not** created now (no demo/user data this sprint).

### D-0013 · Progress is interface-only this sprint

`ProgressService.recordProgress` throws `NotImplementedError` → `POST /api/v1/progress`
returns **501** (payload still validated). Progress needs a learner-progress schema
(attempts, mastery, SRS) that is out of scope; fixing the contract now lets API/UI
integrate early without inventing throwaway tables.

### D-0014 · Layering inside `src/modules/learning`

Hexagonal split — `domain/` (framework-free entities, errors, value objects) ←
`application/` (services + repository ports) ← `infrastructure/` (Prisma repos, mappers,
container) — with **presentation** in `src/app` (route handlers + pages). No business
logic in `page.tsx`/route files; they only adapt HTTP↔services. This mirrors the future
`packages/learning-engine` so extraction is a move, not a rewrite
([ARCHITECTURE_EVOLUTION.md](./ARCHITECTURE_EVOLUTION.md)). **Not an architecture change**
— it realizes the already-documented module layout (SYSTEM_ARCHITECTURE §11).

### D-0015 · Soft delete on user-facing content only

`deletedAt` on `Course`, `Unit`, `Lesson`, `LearningPath` (things learners have history
against); hard delete + cascade on the content sub-tree
(version→activity→exercise→question→choice/answer) and join tables. Repositories filter
`deletedAt: null` by default.

### D-0016 · API under `/api/v1`

The task listed `/courses` etc.; we implement them under **`/api/v1/...`** to honor the
versioning rule in [API.md](./API.md) §1. Same contract, versioned base path.

---

## Earlier decisions

Foundational decisions from Sprints 1–2 are recorded as ADRs:

- [ADR-0001](./adr/ADR-0001.md) — Next.js full-stack + Supabase Auth (MVP).
- [ADR-0002](./adr/ADR-0002.md) — Supabase-Auth-centric identity model + app RBAC.
