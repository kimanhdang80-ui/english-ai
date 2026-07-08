# Milestone 1 — Security Review

> Findings only — remediation scheduled via the debt ledger (PROJECT_OS §7).

## 1. Secrets & key handling (CLAUDE.md §9)

- API keys are read **only** from the environment (`aiEnv` in `src/lib/env.ts`), injected
  into adapters via constructor, and **never** logged or returned. ✅
- Keys are server-only: all provider code sits under `src/modules/ai/**`, reached through
  `import 'server-only'` containers — never bundled to the client, never in `NEXT_PUBLIC_*`. ✅
- `.env.example` ships empty keys with guidance; real `.env` is gitignored. ✅
- Placeholder values are treated as "not configured" (`isRealValue`) so CI/build never sends
  real requests. ✅

## 2. Data exposure & privacy (AI_ENGINE §7)

- Prompts contain only word/definition/level — no PII, no learner records. ✅
- `ai_usage_logs` stores **no prompt text and no secrets** — only feature/provider/model/
  token counts/latency/status/error + nullable `user_id`. ✅
- Provider error messages are surfaced as a bounded `detail` for telemetry only, not shown
  to the learner (they get the deterministic fallback). ✅

## 3. Input handling / injection

- No new user input path or endpoint added; capabilities take internal, typed inputs.
  User-supplied text (e.g. a short answer) is placed into a grounded prompt; **prompt
  injection** from learner content is a known future concern → moderation (DEBT-018). ⚠
- Prisma parameterizes the single `ai_usage_logs` insert (no raw SQL). ✅

## 4. Availability / abuse

- Timeouts + retries bound blast radius; logging failures are swallowed (can't crash a call). ✅
- **No per-user AI quota / rate limit yet** → cost-abuse risk if capabilities are exposed in
  UI. Add quotas + an `ai.generate` permission before that (DEBT-015). ⚠

## 5. Findings

| ID     | Area      | Issue                                                                  | Severity | Proposed action                                               |
| ------ | --------- | ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| SEC-A1 | abuse     | No per-user AI quota / rate limit on capabilities                      | Med      | Add quotas + `ai.generate` perm (DEBT-015) before UI exposure |
| SEC-A2 | ai-safety | No I/O moderation; learner text could attempt prompt injection         | Med      | Moderation + eval harness (DEBT-018)                          |
| SEC-A3 | privacy   | Provider retains prompts per its policy; ensure "no training" + region | Low      | Configure provider data controls at onboarding (AI_ENGINE §7) |

## 6. Verdict

**No key/secret exposure and no new untrusted input path** in this milestone. Open items
(quotas, moderation, provider data controls) are **pre-conditions for exposing AI generation
in the UI** and are logged, not silently deferred.
