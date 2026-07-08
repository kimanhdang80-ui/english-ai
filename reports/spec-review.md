# Spec Review — Vocabulary (Sprint 6.1)

> Findings from reviewing `specs/vocabulary/*` against the implementation. Per
> [PROJECT_OS.md](../docs/PROJECT_OS.md) §0.1, **the spec is not changed here**; where
> code and spec agree, code stays as the spec dictates even if a smoother option exists.
> These are notes for the spec owner to consider in a future, deliberate spec revision.

**Verdict:** the module **conforms to the spec**. No blocking conflicts. Three minor,
non-blocking observations are recorded below. No spec edits and no behavior changes were
made on their account.

---

## Conformance summary

| Spec area                                       | Conforms? | Notes                                                   |
| ----------------------------------------------- | --------- | ------------------------------------------------------- |
| `database.md` (tables/fields/relations/indexes) | ✅        | Matches Prisma schema (incl. `VocabularyPronunciation`) |
| `api.md` (5 endpoints + stats)                  | ✅        | Requests/responses/validation/errors/permission match   |
| `ui.md` (6 screens + states)                    | ✅        | List, Detail, Flashcard, Quiz, Today's Review, Progress |
| `workflow.md` (flows + state machine)           | ✅        | add → review(SRS) → progress; queue predicate matches   |
| `validation.md` (V-01…V-41)                     | ✅        | Enforced across API/service/domain/UI (see tests)       |

## Observations (non-blocking; NOT fixed)

### SR-01 — `POST /user-vocabulary` returns 201 even for an existing entry

`api.md` §4 specifies **201 Created** for the idempotent "add", and the code follows it.
Strict REST semantics would return **200 OK** when the entry already existed (nothing was
created). **Impact:** cosmetic; clients treat 2xx uniformly. **Recommendation:** a future
spec revision could differentiate 201 (created) vs 200 (already present). **Action now:**
none — code follows spec.

### SR-02 — `VocabularyPronunciation` not in the sprint brief's table list

Both the Sprint 4.1 and 6.1 briefs enumerate tables without `VocabularyPronunciation`,
yet IPA (shown on Detail/Flashcard, per `ui.md`) is sourced from it. `database.md` already
documents this table and flags the discrepancy. **Impact:** none — the table is required
and present. **Action now:** none — retained by design.

### SR-03 — Catalog endpoints documented as "no auth required"

`api.md` §1–§2 state catalog reads need no auth; in practice they are only reached from
behind the authenticated dashboard shell. **Impact:** none today; relevant only if a truly
public catalog API is exposed later (rate-limiting/abuse considerations). **Action now:**
none — behavior matches spec.

### SR-04 — `pageSize` validation is ambiguous about `0`

`validation.md` V-02 says `pageSize` is "coerced to 1..100 (default 20); values outside are
clamped." It does not specify whether `pageSize = 0` is (a) an **invalid/absent** value →
use the default (20), or (b) an **out-of-range** value → clamp to 1. The implementation
treats `0` as absent → default 20 (a negative value clamps to 1). Both readings satisfy the
text. **Impact:** cosmetic; either way a valid 1..100 page size is used. **Recommendation:**
clarify V-02 (e.g., "non-positive or non-numeric → default; positive out-of-range → clamp").
**Action now:** none — code keeps a valid interpretation; the unit test documents it.

---

## Outcome

- No specification changed.
- No code changed to "fix" the spec.
- Observations forwarded for a future deliberate spec revision (owner's decision).
