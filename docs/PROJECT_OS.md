# PROJECT_OS.md — Development Operating System (v1)

> The canonical **process** for this project. It governs how every sprint is planned,
> executed, verified, and recorded. It sits **above** feature work: no sprint is "done"
> until this loop is satisfied. Binding for humans and AI. Changes to this file are
> themselves a decision (record in [CHANGELOG.md](./CHANGELOG.md); add an ADR if it
> alters architecture governance).
>
> Companion rulebook: [CLAUDE.md](./CLAUDE.md) (coding rules). This document is the
> **lifecycle**; CLAUDE.md is the **craft**.

---

## 0. Prime directives

1. **Specification is supreme.** If code and spec (`specs/**`) disagree, **the code is
   wrong** — fix the code, never silently change the spec. Changing a spec is a
   deliberate act (see §5).
2. **Discovery ≠ repair.** When you find a smell/debt/drift/dup/dead code/naming/perf/
   security issue, **do not fix it inline**. Log it in
   [`reports/technical-debt.md`](../reports/technical-debt.md) and, if it needs work,
   in [`docs/REFACTOR_PLAN.md`](./REFACTOR_PLAN.md). Fixes are scheduled, not sneaked in.
3. **Gates before changes.** Database and API changes pass an explicit gate (§4, §5)
   before implementation.
4. **Every sprint closes the loop** (§2 → §3) and produces the mandatory reports (§6).
5. **Priorities, in order:** Maintainability · Scalability · Clean Architecture · SOLID ·
   DDD · Production-readiness. When these conflict with speed, they win.

---

## 1. Start-of-sprint reading (MANDATORY)

Before anything else, read and internalize:

- `docs/` (esp. `PRODUCT`, `SYSTEM_ARCHITECTURE`, `DATABASE`, `API`, `AI_ENGINE`,
  `UI_GUIDELINE`, `CLAUDE`, `ARCHITECTURE_EVOLUTION`, `DECISIONS`, `PROJECT_OS`)
- `specs/**` relevant to the sprint
- `reports/**` (last sprint's review + debt + risk)
- `PROJECT_STATE.md`, `CHANGELOG.md`, `NEXT_TASK.md`, `DECISIONS.md`, `CLAUDE.md`

## 2. Pre-code checklist (MANDATORY, in order)

1. **Review previous sprint** — read its report(s); confirm its "remaining work".
2. **Read the related SPEC** — the sprint implements a spec, not an idea.
3. **Check technical debt** — `reports/technical-debt.md`; decide what this sprint pays down.
4. **Check ADRs** — `docs/adr/**`; confirm no decision is being violated.
5. **Check CHANGELOG** — understand what recently changed and why.
6. **Check NEXT_TASK** — that is the sprint's scope and Definition of Done.

> Output of this phase: a short, explicit **sprint plan** (scope, out-of-scope, spec refs,
> debt to address, risks). Use the TODO list to track it.

## 3. Post-code pipeline (MANDATORY, in order)

```
Typecheck → Lint → Build → Review → Refactor (only if planned) →
Update Documentation → Update PROJECT_STATE → Update CHANGELOG →
Update NEXT_TASK → Generate Reports (§6)
```

- **Typecheck / Lint / Build** must be green before review.
- **Review** — self-review against the spec, CLAUDE.md, and acceptance criteria.
- **Refactor** — only refactors that were _planned_ (from the debt ledger). Opportunistic
  cleanups discovered mid-sprint are **logged**, not applied (§0.2), unless trivial and
  in-scope.
- **Docs** — update every doc the change touches; keep DATABASE/API/spec consistent.
- **State/Changelog/Next** — always updated so the next sprint starts from truth.

## 4. Database-change gate

A schema change may proceed **only** after producing, in order:

1. **ADR** (`docs/adr/ADR-NNNN.md`) — context, decision, alternatives, consequences, review.
2. **Impact Analysis** — affected tables, modules, APIs, data volume, read/write paths.
3. **Migration Plan** — forward migration (expand/contract), data backfill, ordering.
4. **Rollback Plan** — how to revert safely (and what data is at risk).

Only then implement (schema + migration). Migrations are backward-compatible where
possible. No destructive migration without a two-phase plan.

## 5. API-change gate

An API change may proceed **only** after:

1. **Update the SPEC** (`specs/**` and/or `docs/API.md`) — the contract changes first.
2. **Review impact** — consumers (UI, SDK, other services), versioning need (`/v2`?).
3. **Update documentation** — request/response/validation/errors/permission.

Only then implement. Breaking changes ship under a new version; deprecations get a window.

## 6. Mandatory per-sprint reports

Each sprint generates a sprint report **and** the six governance reports. Convention:
`reports/sprint-<XX.Y>-report.md` plus a per-sprint folder
`reports/sprint-<XX.Y>/` containing:

| File                     | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `review.md`              | What was built vs the spec; self-review findings; DoD checklist  |
| `architecture-review.md` | Layering/boundaries respected? drift? SOLID/DDD adherence        |
| `technical-debt.md`      | Debt added/paid this sprint (snapshot) → feeds the living ledger |
| `risk-analysis.md`       | Risks (technical/product/ops), likelihood × impact, mitigations  |
| `performance-review.md`  | Hot paths, N+1, payloads, budgets; findings (not fixes)          |
| `security-review.md`     | Authn/authz, input validation, data exposure, OWASP touchpoints  |

Templates live in [`reports/_templates/`](../reports/_templates/). The **living**
technical-debt ledger is [`reports/technical-debt.md`](../reports/technical-debt.md)
(cumulative); per-sprint `technical-debt.md` snapshots append to it.

## 7. Issue-handling policy (log, don't fix)

On discovering any of: **Code Smell · Technical Debt · Architecture Drift · Dead Code ·
Duplicate Code · Naming Problem · Performance Issue · Security Issue** →

- Record it in `reports/technical-debt.md` with: id, type, location, description,
  severity (low/med/high), and a proposed action.
- If it warrants change, add it to `docs/REFACTOR_PLAN.md` and schedule it into a sprint.
- **Do not fix it in the current sprint** unless it is in-scope and part of the plan.

Exception: a fix that is (a) trivially small, (b) directly in the sprint's scope, and
(c) required for the sprint's Definition of Done may be applied — and must still be noted.

## 8. Definition of "Sprint Done"

- [ ] Pre-code checklist (§2) completed and a plan recorded.
- [ ] Typecheck · Lint · Build green (or, for spec-only sprints, format green + no code touched).
- [ ] Spec ↔ code ↔ docs consistent; no silent spec edits.
- [ ] DB/API gates (§4/§5) satisfied if applicable.
- [ ] Docs + PROJECT_STATE + CHANGELOG + NEXT_TASK updated.
- [ ] Sprint report + six governance reports generated.
- [ ] New debt logged; nothing fixed silently.

## 9. Roles

The operator (human or AI) acts as the **Development Operating System**: planner,
implementer within scope, reviewer, and record-keeper — not merely a code generator.
