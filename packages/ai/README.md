# packages/ai — AI ports & prompts (reserved)

> Reserved placeholder (future `@english-ai/ai`). Implements the provider-agnostic AI
> layer from [AI_ENGINE.md](../../docs/AI_ENGINE.md).

## Intended contents

- **Ports (interfaces):** `LlmPort`, `SpeechPort` (STT), `TtsPort`, `ScoringPort`,
  `EmbeddingPort`.
- **Adapters:** Claude (`claude-opus-4-8` / `claude-sonnet-4-6` /
  `claude-haiku-4-5-20251001`), STT/TTS/pronunciation providers — swappable.
- **Prompt templates** (versioned), response validators, usage logging, model-tier config.

## Rule

Depends on `shared`. **No vendor SDK is ever imported outside this package.** Consumed
by the worker (generation/scoring) and, for interactive calls, by the web BFF.
