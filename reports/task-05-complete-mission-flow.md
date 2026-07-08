# Task 05 — Complete Mission Flow

> Roles: Product Designer + Learning Experience Designer + Full-stack Engineer. Complete the full
> learning flow of a mission over the authored Mission Library — **no Learning Model / Engine /
> Database / Mission Library change, no new missions**. Spec: [docs/MISSION_FLOW.md](../docs/MISSION_FLOW.md).
> Date: 2026-07-02.

## 1. What shipped

The complete phased flow, playable end-to-end at `/learn/mission/[missionId]`:

**Dashboard → Today's Goal → Warmup → Vocabulary → Dialogue → Practice → Quiz → Reflection →
Session Summary → Review Queue → Dashboard.**

- **Warmup** (`WarmupStep`) — 30–60s, quick look at 3 words (recall priming).
- **Practice** (`PracticeSession`) — **Fill-Blank** (×3, from library) + **Arrange-Sentence**
  (×≤2, derived from dialogue lines) + **Matching** (×2, from library), scored together.
- **Reflection** (`ReflectionStep`) — self-assessment: "What was hardest today?" and "Confident to
  use this in real life?".
- **Session Summary** (`SummaryStep`) — Mission · Time · Accuracy · Words Learned · Need Review ·
  Tomorrow's Goal.
- **Review Queue** — the mission's review-focus words are shown as queued after the summary.

Supporting pieces: content loader (`src/content/mission-loader.ts`, server-only fs + Zod), pure
flow/arrange helpers (`src/lib/mission-flow/*`), a Missions browser (`/learn/missions`), and a
"Missions" nav entry.

## 2. Constraints honored

- **No Learning Model / Learning Engine change** — nothing in `src/modules/**` touched; the flow is
  presentation over existing content.
- **No Database change** — library content isn't in the DB, so scoring, the summary, and the
  review-queue update are **session-scoped** (client-computed). Persisting to the global SRS needs
  the library seeded via the V2 migration (documented).
- **No new Engine, no new missions** — reuses the Task 04 library (read-only) + Task 03 model.
- **Arrange-Sentence adds no content** — it's a deterministic scramble of existing dialogue lines.
- **Daily loop untouched** — the mission flow is an additive route.

## 3. Files

**Added** — `src/lib/mission-flow/{flow,arrange}.ts` (+ `flow.test.ts`);
`src/content/mission-loader.ts`; `src/components/mission/{mission-flow-player,mission-practice}.tsx`;
routes `learn/mission/[missionId]/page.tsx` + `learn/missions/page.tsx`; `docs/MISSION_FLOW.md`.
**Changed** — `(dashboard)/layout.tsx` (added "Missions" nav link).

## 4. Verification (all green)

| Gate                   | Result                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `npm run typecheck`    | ✅                                                                              |
| `npm run lint`         | ✅ no warnings                                                                  |
| `npm run test`         | ✅ **127** passed (+5: flow phases/accuracy, arrange scramble/correctness)      |
| `npm run format:check` | ✅                                                                              |
| `npm run build`        | ✅ 26/26 pages (`/learn/mission/[missionId]` dynamic, `/learn/missions` static) |

## 5. Notes / follow-ups

- **Review-queue persistence** — session-scoped today; wire to the real SRS once the library is
  seeded into the DB (V2 migration P2/P4). Then Need-Review words feed the dashboard Recent Activity.
- **Listening / Speaking** phases — insert when those activity builders + content exist (Task 03
  placeholders).
- **Reflection answers** — currently in-session; persist later to personalize missions / the AI Coach.
- **Audio** on vocabulary/dialogue when media is authored.
