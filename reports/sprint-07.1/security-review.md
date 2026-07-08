# Sprint 7.1 — Security Review

> Findings only — remediation scheduled via the debt ledger (PROJECT_OS §7).

## 1. Authentication & authorization

- AI admin pages are under the `(admin)` group → `requirePermission('admin.panel_access')`
  in the layout (Node runtime). ✅
- **Gap:** no dedicated `ai.generate` permission — content_manager/teacher can't be granted
  AI access without full admin. Logged **DEBT-015**.

## 2. Input validation

- Prompt building validates required variables (`ValidationError`) and rejects empty
  prompts; output validation checks length/format/shape. No provider input reaches a model
  this sprint (stub).

## 3. Data exposure

- No secrets added; **no AI API key** present or referenced (no provider). No PII flows
  through the module. Prompt templates are non-sensitive.

## 4. OWASP touchpoints

- **Prompt injection (future):** the top risk once a provider is wired (RISK-01) — inputs
  must be treated as untrusted and the system prompt hardened before 7.2 goes live.
- **Access control:** admin-gated (above). **Secrets:** none. **Injection:** N/A (no DB/provider).

## 5. Findings

| ID     | Area   | Issue                                               | Severity     | Proposed action                              |
| ------ | ------ | --------------------------------------------------- | ------------ | -------------------------------------------- |
| SEC-01 | authz  | AI tools lack a dedicated permission                | Low          | DEBT-015 (Sprint 7.2)                        |
| SEC-02 | future | Prompt injection surface when provider is connected | High (later) | Harden in 7.2 (RISK-01) before any live call |

## 6. Verdict

**No live security exposure ✅** (no provider, no secrets, admin-gated). Two forward-looking
items logged for the provider-integration sprint.
