# Sprint 7.1 — Performance Review

> Findings only — logged, not fixed (PROJECT_OS §7).

## 1. Hot paths reviewed

- `LessonGeneratorService.preview()` (render + validate + estimate) and the admin pages
  reading the template registry.

## 2. Findings

| ID      | Area   | Issue                                                                  | Evidence                   | Severity | Proposed action                                         |
| ------- | ------ | ---------------------------------------------------------------------- | -------------------------- | -------- | ------------------------------------------------------- |
| PERF-01 | domain | `PromptRenderer` compiles a regex per call                             | `prompt-renderer.ts`       | Low      | Negligible for short prompts; acceptable                |
| PERF-02 | infra  | Prompt-versions page does `Promise.all` of `listVersions` per template | `prompt-versions/page.tsx` | Low      | Fine for 2 templates; batch if the registry grows large |
| PERF-03 | future | Real generation latency/cost                                           | (7.2)                      | Med      | Model tiering + prompt caching + quotas — RISK-03       |

## 3. Data / compute

- No DB access this sprint (in-memory). `preview()` is pure/CPU-only and O(prompt length).
- Token estimation is a heuristic (chars/4) — cheap; see RISK-02 for accuracy.

## 4. Frontend

- 4 new admin routes at ~194 B each; no client JS added (server-rendered placeholders).

## 5. Budgets

- Nothing regressed; no measurable cost until a provider is wired.
