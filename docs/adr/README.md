# Architecture Decision Records (ADR)

This directory records **significant, hard-to-reverse architectural decisions** and
the reasoning behind them, so future engineers (and AI agents) understand _why_ the
system is the way it is — not just _what_ it is.

## When to write an ADR

Write one when a decision:

- is costly or disruptive to reverse (framework, data store, auth model, service
  boundaries, deployment topology), **or**
- affects multiple modules / long-term scalability, **or**
- overrides or amends an authoritative doc in `docs/`.

Small, local, easily-reversible choices do **not** need an ADR — a code comment or PR
description is enough.

## Process

1. Copy the template below into `ADR-NNNN.md` (zero-padded, next number in sequence).
2. Fill every section. Keep it concise and specific.
3. Open it as `Proposed`; move to `Accepted` on review (per [CLAUDE.md](../CLAUDE.md) §5/§7).
4. Never rewrite history: to change a decision, add a **new** ADR that
   `Supersedes` the old one and set the old one's status to `Superseded by ADR-NNNN`.
5. Link the ADR from any doc it amends.

## Status values

`Proposed` · `Accepted` · `Superseded by ADR-NNNN` · `Deprecated`

## Template

```markdown
# ADR-NNNN — <short title>

- **Status:** Proposed | Accepted | Superseded by ADR-XXXX | Deprecated
- **Date:** YYYY-MM-DD
- **Deciders:** <who>
- **Sprint:** <n>
- **Supersedes / Superseded by:** <ADR ref, if any>

## Context

<The forces at play: problem, constraints, requirements. Why a decision is needed now.>

## Decision

<The choice made, stated plainly and actively ("We will…").>

## Alternatives

<Each option considered, with pros/cons and why it was or wasn't chosen.>

## Consequences

<Positive and negative outcomes, new risks, and their mitigations.>

## Future Review

<Concrete triggers/criteria and a scheduled checkpoint for revisiting this decision.>
```

## Index

| ADR                       | Title                                           | Status   |
| ------------------------- | ----------------------------------------------- | -------- |
| [ADR-0001](./ADR-0001.md) | Next.js full-stack + Supabase Auth (MVP)        | Accepted |
| [ADR-0002](./ADR-0002.md) | Supabase-Auth-centric identity model + app RBAC | Accepted |
