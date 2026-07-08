# Task 04 — Build Mission Library

> Role: Senior English Curriculum Designer + Senior Software Engineer. Build the first Mission
> Library (4 tracks × 10 missions) as **structured content only** — no Learning Engine / DB / API
> change. Library index: [docs/MISSION_LIBRARY.md](../docs/MISSION_LIBRARY.md). Date: 2026-07-02.

## 1. What shipped

- **40 missions** across **4 tracks** (General, Business, Construction, Travel), authored as
  JSON under `content/tracks/*.json` and `content/missions/<track>/<id>.json` — **not hard-coded
  in components**.
- **Content schema** `src/content/mission-schema.ts` (Zod) — the importable contract for a future
  seed into the Mission Engine (Task 03) with no engine change.
- **Validation test** `src/content/mission-library.test.ts` — loads + Zod-validates every file and
  checks counts, id/prerequisite chains, review-focus integrity, and MC answer validity.

Each mission has: Mission Title · Goal · Difficulty · Estimated Time · Prerequisite · Completion
Criteria (quiz ≥ 80%) · Vocabulary (8: word/IPA/meaning/example) · Dialogue (8–10 lines) ·
Exercises (5 MC + 3 fill-blank + 2 matching) · Review Focus (5 words). Level **A0–A1**;
Vietnamese meanings (native scaffolding), English examples/dialogues.

## 2. Constraints honored

- **No Learning Engine / Database / API change** — content lives under `content/` + a schema/test
  under `src/content/`. Nothing in `src/modules/**` (engine) or `prisma/**` changed.
- **Structured & importable** — JSON validated by a shared Zod schema; a seed can load it later.
- **Not hard-coded in components** — no component references this content; it's pure data.

## 3. Library totals (measured)

| Item             | Count                                                                            |
| ---------------- | -------------------------------------------------------------------------------- |
| **Tracks**       | **4**                                                                            |
| **Missions**     | **40**                                                                           |
| **Vocabulary**   | **320** (8 × 40)                                                                 |
| **Dialogue**     | **380** lines                                                                    |
| **Exercises**    | **400** (200 multiple-choice + 120 fill-blank + 80 matching; 320 matching pairs) |
| **Review focus** | **200** words (5 × 40)                                                           |

## 4. Verification (all green)

| Gate                   | Result                                    |
| ---------------------- | ----------------------------------------- |
| `npm run typecheck`    | ✅                                        |
| `npm run lint`         | ✅ no warnings                            |
| `npm run test`         | ✅ **122** passed (+8 content-validation) |
| `npm run format:check` | ✅ (content JSON formatted)               |
| `npm run build`        | ✅ 25/25 pages                            |

The content-validation test proves all 40 missions are schema-valid, prerequisites chain linearly,
review-focus words come from each mission's own vocabulary, and exercise counts are exactly 5/3/2.

## 5. Missing missions / gaps (as requested)

- **No Listening / Speaking content** — those activity types are engine placeholders (Task 03).
- **No audio / images** for vocabulary (text + IPA only).
- **Cross-track prerequisites** not encoded as data (General-first is documented, not enforced).
- **Not seeded** into the Mission Engine / DB yet — happens via the V2 migration (P2 persist, P4 cutover).
- **A1 ceiling** — no A2+ tracks; no Grammar/Reading/Writing skill missions.

## 6. Follow-ups

- Seed the library into the Mission Engine via the migration DB gate (P2); wire tracks/missions into
  the daily loop + UI at cutover (P4).
- Add audio/images and Listening/Speaking content when those activity builders are implemented.
- Expand to A2+ and encode cross-track prerequisites as data.
