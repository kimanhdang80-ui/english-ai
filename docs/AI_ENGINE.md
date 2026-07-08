# AI_ENGINE.md — English AI

> How AI powers the platform. Every AI capability is behind a **provider-agnostic
> port**; the domain never calls a vendor SDK directly. All calls are logged
> (tokens, cost, latency) and cached where deterministic.

---

## 1. Design Principles

1. **Ports & adapters.** Domain depends on interfaces (`LlmPort`, `SpeechPort`, `TtsPort`, `ScoringPort`, `EmbeddingPort`). Providers are swappable adapters.
2. **Model tiering for cost/quality.** Cheapest capable model per task; escalate only when needed.
3. **Deterministic where possible.** Structured outputs (JSON schema / tool use) over free text; pedagogy logic stays in the deterministic Learning Engine.
4. **Everything logged.** `ai_usage_logs` captures every call for cost, latency, and quality analysis.
5. **Safety first.** Content filtering, PII scrubbing, age-appropriate guardrails (Kids), and no hallucinated scores.
6. **Caching & reuse.** Prompt caching, TTS dedup by content hash, and cached generations for identical inputs.

## 2. Model Strategy (Claude-first)

| Task                                                                   | Model                       | Why                                      |
| ---------------------------------------------------------------------- | --------------------------- | ---------------------------------------- |
| AI Teacher reasoning, lesson generation, exam writing/speaking grading | `claude-opus-4-8`           | Deepest reasoning & pedagogy quality     |
| Conversation partner, explanations, feedback                           | `claude-sonnet-4-6`         | Strong quality at low latency/cost       |
| Fast classification, short grading, tagging, safety checks             | `claude-haiku-4-5-20251001` | Cheapest, fast, high-volume              |
| Embeddings (semantic search, dedup, recommendation)                    | Embeddings API → `pgvector` | Vector retrieval                         |
| Speech-to-Text                                                         | Whisper / provider STT      | Transcription for speaking/pronunciation |
| Text-to-Speech                                                         | ElevenLabs / Azure TTS      | Natural lesson & conversation audio      |
| Pronunciation scoring                                                  | Azure Speech Assessment     | Phoneme/word/prosody scoring             |

**Escalation rule:** start at the cheapest tier; escalate to a stronger model when confidence is low, the task is high-stakes (exam scoring), or output validation fails.

> Model IDs are centralized in config (`packages/ai`), never hardcoded in feature code, so upgrades are a one-line change.

## 3. AI Capabilities

### 3.1 AI Teacher

**Role:** patient tutor that explains, motivates, reviews mistakes, and sets goals.

- **Inputs:** learner profile (CEFR, native language, goals), recent errors, weakness profile, current lesson context.
- **Behaviors:** explain a rule/word simply (optionally in native language), review recent mistakes with prioritized fixes, encourage and set the next goal.
- **Model:** `claude-opus-4-8` for review/planning; `claude-sonnet-4-6` for quick Q&A.
- **Output:** structured feedback → persisted in `ai_feedback` / `ai_teacher_sessions`.
- **Guardrails:** never invent scores; always ground explanations in the learner's actual attempts.

### 3.2 Conversation AI

**Role:** natural, level-adaptive dialogue partner (free chat or scenario roleplay).

- **Level adaptation:** vocabulary and sentence complexity constrained to the learner's CEFR (i+1).
- **Persona:** from `conversation_scenarios.persona` (name, role, style, goal).
- **Dual output per turn:** (1) in-character reply, (2) _silent_ correction object (grammar/word-choice) surfaced non-intrusively.
- **Voice:** STT in → reply → TTS out for voice-first practice; streamed over WebSocket for low latency.
- **Model:** `claude-sonnet-4-6` (fallback Haiku). End-of-conversation summary/report by Sonnet/Opus.
- **Persistence:** `conversations`, `conversation_messages` (with tokens/model/corrections).

### 3.3 Lesson Generator

> **Foundation implemented (Sprint 7.1) — no provider call.** `src/modules/ai` ships the
> hexagonal framework: versioned **prompt templates** (`config/prompt-templates.ts`,
> prompts as data), `PromptRenderer`, `PromptBuilder`, `ContentValidator`,
> `DifficultyAdjuster`, `TokenEstimator`, and `LessonGeneratorService` (a working AI-free
> `preview()` + a `generate()` behind the provider-agnostic `LlmPort`). See D-0022…D-0024.
>
> **Provider wired (Milestone 1 — real AI).** `LlmPort` now resolves to a real provider
> chain built from configuration: `ClaudeProvider` / `OpenAIProvider` (REST via `fetch`,
> no SDK) selected by `AI_PROVIDER`, wrapped with `RetryingProvider` (timeout + backoff)
> and an optional `FallbackProvider`, assembled by `ProviderFactory`. Three learner-facing
> capabilities (`AiTextService`: vocabulary **explanation**, example **generation**,
> short-answer **feedback**) replace the Sprint-7.1 mocks and degrade to deterministic
> fallbacks when AI is off/failing. Every call is logged to **`ai_usage_logs`** (ADR-0003).
> Keys come only from the environment. Setup: [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md).
> Still pending: `prompt_templates`/`ai_generation_jobs` persistence and an async job
> pipeline (DEBT-014); a golden-dataset evaluation harness (§6).

**Role:** produce lessons, exercises, examples, and distractors on demand for any topic/level.

- **Inputs:** topic, target CEFR, skill, learner weaknesses, desired activity types.
- **Output (structured JSON):** lesson objective + ordered `lesson_activities` (flashcards, MCQ with plausible distractors, gap-fill, dictation, speaking prompts) validated against a schema before persistence.
- **Pipeline:** generate → **validate** (schema + pedagogy checks: level fit, answer-key correctness, no duplicates) → optional TTS render → persist as versioned content (`is_ai_generated=true`).
- **Model:** `claude-opus-4-8`; grading/validation pass may use Haiku.
- **Runs async** via `ai_generation_jobs` (BullMQ). Human review gate for published curriculum content.

### 3.4 Pronunciation Scoring

**Role:** phoneme-level assessment and actionable drill suggestions.

- **Flow:** learner audio → STT + **Azure Speech Assessment** → accuracy / completeness / prosody + per-word + per-phoneme scores.
- **AI layer:** Claude turns raw scores into human feedback ("your /θ/ in _think_ sounds like /s/ — try…") and recommends minimal-pair drills.
- **Persistence:** `speaking_attempts`, `pronunciation_scores`, `phoneme_scores`.
- **Rule:** scores come from the scoring engine, **never** hallucinated by the LLM.

### 3.5 Grammar Correction

**Role:** detect, correct, and explain errors in learner output (speaking transcript / writing).

- **Output (structured):** list of `{ span, errorType, correction, explanation, severity }`.
- **Use:** inline conversation corrections, writing feedback, targeted grammar practice generation.
- **Model:** `claude-sonnet-4-6`; escalate to Opus for exam-grade writing feedback.
- **Feeds** the Weakness Detector (each error becomes a `weakness_signal`).

### 3.6 Daily Planner (AI-assisted)

**Role:** assemble an effective, time-boxed daily plan.

- **Deterministic core (Learning Engine):** due SRS reviews + next curriculum items + weakness-targeted practice, fitted to `daily_minutes_goal`.
- **AI layer (optional):** re-rank / theme the plan, write a motivating summary, and choose conversation topics matching interests.
- **Output:** `daily_plans` + `daily_plan_items` with a `reason` per item (due_review / new_content / weakness / goal).
- **Principle:** scheduling math is deterministic and testable; AI adds personalization on top, never replaces the algorithm.

### 3.7 Weakness Detection

**Role:** build and maintain a per-learner weakness profile.

- **Signals:** wrong answers, slow responses, skips, low pronunciation/speaking scores, SRS lapses → `weakness_signals` (weighted).
- **Aggregation:** rolled up into `weakness_profiles.by_skill` / `by_topic`.
- **AI layer:** clusters recurring error patterns ("consistently confuses past simple vs present perfect") into named, actionable weaknesses.
- **Consumers:** Daily Planner, Adaptive Sequencer, AI Teacher review.

### 3.8 Adaptive Learning

**Role:** keep every learner in the i+1 zone.

- **Ability model:** `adaptive_states.estimated_ability` (IRT-like theta per skill) updated from attempt outcomes.
- **Difficulty targeting:** choose next-item difficulty to keep success rate in the optimal band (~70–85%).
- **Escalation/de-escalation:** consecutive success raises difficulty; struggle inserts remediation + more SRS.
- **SRS integration:** FSRS parameters personalized over time from review history.
- **Placement:** the adaptive engine also powers the placement test (fewer items, faster convergence).

## 4. Orchestration Architecture

```
Feature module ──▶ AiPort (interface) ──▶ AI Orchestrator ──▶ Adapter ──▶ Provider
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     ▼                       ▼                       ▼
              Prompt Template          Response Validator        Usage Logger
             (versioned, DB)          (schema / tool-use)      (tokens/cost/latency)
                     │                       │                       │
                     ▼                       ▼                       ▼
                Prompt Cache           Retry/Escalate           ai_usage_logs
```

- **Prompt templates** are versioned in `prompt_templates` (not hardcoded) → prompts can be improved without redeploy.
- **Structured outputs** via tool-use / JSON schema; a validator rejects malformed output and retries or escalates.
- **Async jobs** (`ai_generation_jobs`) for anything slow; clients poll `/jobs/{id}` or subscribe via WS.
- **Streaming** for conversation & teacher answers over WebSocket.

## 5. Cost, Caching & Performance

| Lever              | Mechanism                                           |
| ------------------ | --------------------------------------------------- |
| Model tiering      | Haiku → Sonnet → Opus by task/confidence            |
| Prompt caching     | Cache stable system/context prefixes across calls   |
| Generation caching | Identical (template, inputs) → cached result        |
| TTS dedup          | Cache renders by content hash in `media_assets`     |
| Batching           | Batch non-interactive generation/grading jobs       |
| Budgets            | Per-user & per-plan AI quotas enforced at API layer |
| Observability      | `ai_usage_logs` powers cost dashboards & alerts     |

## 6. Safety, Quality & Evaluation

- **Content safety:** input/output moderation; age-appropriate guardrails for **Kids** (restricted topics, no free-form web-like content, no personal data collection from minors).
- **PII handling:** scrub PII before logging; learner recordings are private, signed-URL only.
- **Grounding:** feedback and scores must reference the learner's actual attempt data; hallucinated numbers are a defect.
- **Human-in-the-loop:** AI-generated _published curriculum_ passes review before release; on-the-fly practice is validated by schema + heuristic checks.
- **Evaluation harness:** golden datasets per capability (lesson quality, correction accuracy, scoring correlation vs human raters, conversation level-fit). Regression-tested on prompt/model changes.
- **Fallbacks:** provider outage → fallback model/provider; `AI_UNAVAILABLE` surfaced gracefully with cached/offline alternatives (e.g., SRS review still works).

## 7. Privacy & Compliance

- Learner data used for personalization is not sent to providers for training.
- Data minimization in prompts (send only what the task needs).
- Deletion cascades remove AI artifacts tied to a deleted account.
- Region-aware processing where required (GDPR / local law).

---

_Cross-references:_ interfaces & modules → [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md); AI tables → [DATABASE.md](./DATABASE.md); async endpoints → [API.md](./API.md); guardrail rules → [CLAUDE.md](./CLAUDE.md).
