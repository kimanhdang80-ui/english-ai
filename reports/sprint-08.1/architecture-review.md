# Sprint 8.1 — Architecture Review

## 1. Layering & boundaries

- Domain free of framework/Prisma? **Yes** — status mapping + streak are pure and tested.
- Application depends only on ports? **Yes** — services take `LessonSourcePort`,
  `ExplanationPort`, `ReviewActivityRepository`, `SessionRepository`.
- Infrastructure implements ports; presentation adapts only? **Yes** — dashboard/player
  call the container; no logic in pages.

## 2. Module boundaries

- daily-loop → vocabulary via the **`LessonSourcePort`** (narrow), not by reaching into
  vocabulary internals. Type-only imports of `QuizItem`/`ReviewCard` at the boundary.
- No change to vocabulary/AI modules. `QuizSession` enhancement is backward compatible.

## 3. SOLID / DDD

- **SRP:** lesson assembly / queue mapping / streak / history are separate services.
- **DIP:** the AI is an abstraction (`ExplanationPort`) — mock now, real later; the data
  source is an abstraction (`LessonSourcePort`) — enables pure unit tests with a fake.
- **OCP:** swap mock→AI explanation or in-memory→Prisma sessions at the container only.

## 4. Architecture drift

| Drift        | Where                          | Severity | Action   |
| ------------ | ------------------------------ | -------- | -------- |
| (none new)   | —                              | —        | —        |
| pre-existing | pagination cross-module import | Low/Med  | DEBT-006 |

## 5. ADR check

- No ADR violated; **no new ADR** — composition within the documented architecture.
- A future `learning_sessions` table **will** require the DB gate (DEBT-016).

## 6. Verdict

**Aligned ✅** — ports keep the composition decoupled; no framework growth, no DB change.
