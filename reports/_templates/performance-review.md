# Sprint <XX.Y> — Performance Review

> Copy to `reports/sprint-<XX.Y>/performance-review.md`. Findings only — fixes are
> logged to technical-debt/refactor-plan ([PROJECT_OS.md](../../docs/PROJECT_OS.md) §7),
> not applied here. Budgets per [CLAUDE.md](../../docs/CLAUDE.md) §10.

## 1. Hot paths reviewed

- <endpoints / queries / renders inspected>

## 2. Findings

| ID       | Area            | Issue                                  | Evidence | Severity     | Proposed action     |
| -------- | --------------- | -------------------------------------- | -------- | ------------ | ------------------- |
| PERF-### | db/api/frontend | e.g. N+1, missing index, large payload |          | low/med/high | log → refactor-plan |

## 3. Database

- Indexes cover query paths? N+1 present? transactions short? <notes>

## 4. Frontend

- Bundle/route sizes, code-split, image/optimization, skeletons. <notes>

## 5. Budgets

- Are Core Web Vitals / latency budgets respected or at risk? <notes>
