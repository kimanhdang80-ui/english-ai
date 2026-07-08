# Milestone 1 — Review (built vs intent + DoD)

## What was built vs the request

| Requirement                                              | Status | Where                                                       |
| -------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| Design an AI Provider Pattern                            | ✅     | `providers/` (interface + adapters + decorators + factory)  |
| Support OpenAI + Anthropic; extensible to Gemini         | ✅     | `ClaudeProvider`, `OpenAIProvider`; factory `case` for +1   |
| `AIProvider` interface                                   | ✅     | `providers/types.ts`                                        |
| `OpenAIProvider`                                         | ✅     | `providers/openai-provider.ts`                              |
| `ClaudeProvider`                                         | ✅     | `providers/claude-provider.ts`                              |
| `ProviderFactory`                                        | ✅     | `providers/provider-factory.ts`                             |
| All API keys from environment, no hardcode               | ✅     | `lib/env.ts` `aiEnv`; container passes real-or-empty keys   |
| Replace mock at Vocabulary Explanation                   | ✅     | `AiExplanationAdapter` swapped in daily-loop container      |
| Replace mock at Example Generation                       | ✅     | `AiTextService.generateExample` (was stub-only)             |
| Replace mock at Short Answer Feedback                    | ✅     | `AiTextService.feedbackOnShortAnswer` (was stub-only)       |
| Provider selectable by configuration                     | ✅     | `AI_PROVIDER` / `AI_FALLBACK_PROVIDER` env                  |
| On error: Retry / Timeout / Log / Graceful fallback      | ✅     | Retry+Fallback providers; timeout; usage log; det. fallback |
| No UI / Learning-Engine change; DB only for AI history   | ✅     | container-only swap; `ai_usage_logs` via gate               |
| Typecheck / Lint / Build                                 | ✅     | all green                                                   |
| Update STATE / CHANGELOG / NEXT_TASK / report            | ✅     | done                                                        |
| `AI_INTEGRATION_GUIDE.md` (key / config / cost / switch) | ✅     | `docs/AI_INTEGRATION_GUIDE.md`                              |

## Self-review notes

- Example generation & short-answer feedback had **no prior runtime mock** (Sprint 7.1 was
  foundation-only, stub throws 501). They are now first-class provider-backed capabilities
  with a deterministic fallback — matching the intent ("replace mock with real AI").
- `AiTextService` never throws at callers: unconfigured/failed/invalid-output all fall back.
  This keeps the daily loop working with AI off (verified by unit tests).
- Prompts remain **data** (versioned templates) — no inline prompt strings in services.

## Definition of Done (PROJECT_OS §8)

- [x] Pre-code checklist + plan recorded (todos).
- [x] Typecheck · Lint · Build green; tests green (81).
- [x] Spec ↔ code ↔ docs consistent (DATABASE `ai_usage_logs` updated to match the table).
- [x] DB gate satisfied (ADR-0003 + impact + migration + rollback). No API change → no API gate.
- [x] Docs + STATE + CHANGELOG + NEXT_TASK updated.
- [x] Milestone report + 6 governance reports generated.
- [x] New debt logged (DEBT-018…021; DEBT-014 → PARTIAL); nothing fixed silently.
