# MISSION_LIBRARY.md

> The first Mission Library (Task 04) — authored **content only**, no engine/DB/API change.
> 4 Tracks × 10 Missions = **40 missions**, stored as structured JSON under
> [`content/`](../content) (importable later by the Mission Engine — see
> [MISSION_ENGINE.md](./MISSION_ENGINE.md)). Schema + validation:
> `src/content/mission-schema.ts` + `src/content/mission-library.test.ts`.
> Level: **A0–A1** (Vietnamese glosses for meanings; English examples/dialogues).

---

## 1. Layout

```
content/
  tracks/      general.json · business.json · construction.json · travel.json
  missions/
    general/       general-01.json … general-10.json
    business/      business-01.json … business-10.json
    construction/  construction-01.json … construction-10.json
    travel/        travel-01.json … travel-10.json
```

Each **mission** carries: Mission Title · Goal · Difficulty · Estimated Time · Prerequisite ·
Completion Criteria · Vocabulary (8) · Dialogue (8–10) · Exercises (5 MC + 3 fill-blank +
2 matching) · Review Focus (5). Completion = **quiz ≥ 80%** (`min_quiz_score` 0.8).

## 2. Tracks

| Track                | Key            | CEFR | Missions | Theme                     |
| -------------------- | -------------- | ---- | -------- | ------------------------- |
| General English      | `general`      | A1   | 10       | Everyday survival English |
| Business English     | `business`     | A1   | 10       | Workplace basics          |
| Construction English | `construction` | A1   | 10       | On-site / trade English   |
| Travel English       | `travel`       | A1   | 10       | Travelling abroad         |

## 3. Missions

### General English (`general`)

| #   | id         | Title                     | Difficulty |
| --- | ---------- | ------------------------- | ---------- |
| 1   | general-01 | Greetings & Introductions | easy       |
| 2   | general-02 | Family & People           | easy       |
| 3   | general-03 | Numbers & Time            | easy       |
| 4   | general-04 | Food & Drink              | easy       |
| 5   | general-05 | Home & Rooms              | medium     |
| 6   | general-06 | Daily Routine             | medium     |
| 7   | general-07 | Shopping & Money          | medium     |
| 8   | general-08 | Weather & Seasons         | medium     |
| 9   | general-09 | Directions & Places       | hard       |
| 10  | general-10 | Hobbies & Free Time       | hard       |

### Business English (`business`)

| #   | id          | Title                      | Difficulty |
| --- | ----------- | -------------------------- | ---------- |
| 1   | business-01 | Office Introductions       | easy       |
| 2   | business-02 | Job Titles & Departments   | easy       |
| 3   | business-03 | Telephone Basics           | easy       |
| 4   | business-04 | Emails & Messages          | easy       |
| 5   | business-05 | Meetings & Scheduling      | medium     |
| 6   | business-06 | Describing Your Work       | medium     |
| 7   | business-07 | Numbers, Prices & Invoices | medium     |
| 8   | business-08 | Making Requests            | medium     |
| 9   | business-09 | Small Talk at Work         | hard       |
| 10  | business-10 | Presentation Basics        | hard       |

### Construction English (`construction`)

| #   | id              | Title                   | Difficulty |
| --- | --------------- | ----------------------- | ---------- |
| 1   | construction-01 | Tools & Equipment       | easy       |
| 2   | construction-02 | Materials               | easy       |
| 3   | construction-03 | Safety & PPE            | easy       |
| 4   | construction-04 | On the Site (roles)     | easy       |
| 5   | construction-05 | Measurements & Sizes    | medium     |
| 6   | construction-06 | Instructions & Commands | medium     |
| 7   | construction-07 | Machines & Vehicles     | medium     |
| 8   | construction-08 | Problems & Repairs      | medium     |
| 9   | construction-09 | Time & Schedule on Site | hard       |
| 10  | construction-10 | Reporting & Handover    | hard       |

### Travel English (`travel`)

| #   | id        | Title                       | Difficulty |
| --- | --------- | --------------------------- | ---------- |
| 1   | travel-01 | At the Airport              | easy       |
| 2   | travel-02 | Check-in & Hotel            | easy       |
| 3   | travel-03 | Directions in the City      | easy       |
| 4   | travel-04 | Transport & Tickets         | easy       |
| 5   | travel-05 | Eating Out                  | medium     |
| 6   | travel-06 | Shopping & Souvenirs        | medium     |
| 7   | travel-07 | Money & Exchange            | medium     |
| 8   | travel-08 | Emergencies & Health        | medium     |
| 9   | travel-09 | Sightseeing                 | hard       |
| 10  | travel-10 | Making Friends & Small Talk | hard       |

## 4. Dependencies

- **Within a track:** strictly linear. `mission-01` has `prerequisite: null`; every later mission
  requires the previous one (`mission-0N.prerequisite = mission-0(N-1)`). Difficulty ramps
  easy (1–4) → medium (5–8) → hard (9–10). (Enforced by the validation test.)
- **Across tracks:** **General English is the foundation.** Business / Construction / Travel are
  themed extensions and are best started after the first few General missions (recommended, not
  hard-enforced — cross-track prerequisites are a future, data-only addition).

## 5. Learning Paths

```
Foundation ─▶ General 01 → 02 → 03 → … → 10
                     │  (recommended: after General 01–04, branch by goal)
                     ├─▶ Business 01 → … → 10     (workplace)
                     ├─▶ Construction 01 → … → 10 (trade / site)
                     └─▶ Travel 01 → … → 10       (travelling)
```

The daily generator (Task 02) + Mission Engine (Task 03) pick the learner's track from their
**goal** and serve the next uncompleted mission (or defer to review when the queue is heavy).

## 6. Library totals

| Item               | Count                                                           |
| ------------------ | --------------------------------------------------------------- |
| Tracks             | 4                                                               |
| Missions           | 40                                                              |
| Vocabulary words   | 320 (8 × 40)                                                    |
| Dialogue lines     | 380                                                             |
| Exercises          | 400 (200 MC + 120 fill-blank + 80 matching; 320 matching pairs) |
| Review-focus words | 200 (5 × 40)                                                    |

## 7. Missing / not yet included (follow-ups)

- **No Listening / Speaking activities** — those activity types are engine placeholders (Task 03);
  the library has no audio/speaking content yet.
- **Audio & images** for vocabulary are not authored (text + IPA only).
- **Cross-track prerequisites** (e.g. "General 01–04 before Business") are recommended in this doc
  but not encoded as data yet.
- **Not wired into the app** — content is authored + validated but not yet seeded into the
  Mission Engine / DB; that happens via the Learning Model V2 migration (P2 persist, P4 cutover).
- **CEFR ceiling A1** — no A2+ missions yet; deeper levels are future tracks.
- **Grammar / Reading / Writing** skills are not covered (vocabulary + dialogue + quiz focus).

## 8. How to use later (no code change now)

`src/content/mission-schema.ts` is the importable contract; a future seed script can
`readdir` + `MissionContentSchema.parse` each file and load it into the Mission Engine
(`missionEngine.missions.save`) — no engine change required.
