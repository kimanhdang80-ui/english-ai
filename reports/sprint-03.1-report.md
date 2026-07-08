# SPRINT 3.1 REPORT — Learning Engine Core

- **Epic:** 3 — Learning Engine
- **Sprint:** 3.1
- **Date:** 2026-07-01
- **Status:** ✅ Complete — typecheck, lint, build all green
- **Scope rule honored:** no English lessons, no vocabulary, no AI, **no demo/sample
  data**, no hard-coded business values. The one schema evolution is analyzed in
  [DECISIONS.md](../docs/DECISIONS.md).

---

## 1. Domain model

The engine is **content-type-agnostic** — one engine for every lesson kind
([DECISIONS.md](../docs/DECISIONS.md) D-0009). Entities:

- **Taxonomy:** `Skill`, `Difficulty`, `Tag`, `LearningObjective`.
- **Hierarchy:** `Course` → `Unit` → `Lesson` → **`LessonVersion`** (versioned snapshot).
- **Content tree:** `Activity` → `Exercise` → `Question` → (`Choice` | `Answer`).
- **Sequencing:** `LessonDependency` (prereq graph), `LearningPath` + `LearningPathStep`.
- **Joins:** `LessonTag`, `LessonObjective`.

`Answer` = **answer key** (not user submissions); `Choice` = selectable option (D-0012).
Content is **versioned** (D-0010) and **soft-deleted** on user-facing entities (D-0015).

## 2. ERD (text)

```
Course 1─* Unit 1─* Lesson 1─* LessonVersion 1─* Activity 1─* Exercise 1─* Question
                    │                                                        ├─* Choice
                    │                                                        └─* Answer(key)
Lesson 1─1 currentVersion → LessonVersion
Lesson *─* Tag (LessonTag) · Lesson *─* LearningObjective (LessonObjective)
Lesson *─* Lesson (LessonDependency: prerequisite|recommended)
LearningPath 1─* LearningPathStep ─→ (Course | Lesson | LearningObjective)
Difficulty 1─* (Lesson | Exercise | Question)
Skill/CefrLevel referenced by Lesson/Course
```

## 3. Prisma schema

- **30 tables total** (10 auth/RBAC from Sprint 2.1 + 20 engine/reference).
- Enums added: `ContentStatus`, `ActivityType`, `ExerciseType`, `QuestionType`,
  `DependencyType`, `PathStepType`. `Difficulty`/`Tag`/`Skill` are **tables** (data),
  discriminators are enums (D-0011).
- Relations use explicit names for the two Lesson↔LessonVersion relations
  (`lesson_versions`, `current_version`) and the self-referential `LessonDependency`
  (`dependent`/`prerequisite`).
- Constraints: unique (`lessons.slug`, `courses.slug`, `lesson_versions(lessonId,versionNumber)`,
  `lesson_dependencies(lessonId,dependsOnLessonId)`), cascade deletes down the content
  tree, `SetNull`/`Cascade` as appropriate. Indexes on every FK + query path.
- **Validated** (`prisma validate` ✅) and **client generated** (✅). A Prisma-generated
  SQL reference (`migrate diff`) confirms runnable DDL; `prisma migrate dev` runs in a DB
  environment (no local DB here).

## 4. API (skeleton, `/api/v1`)

| Endpoint                        | Status                            |
| ------------------------------- | --------------------------------- |
| `GET /courses`, `/courses/{id}` | ✅                                |
| `GET /units`                    | ✅                                |
| `GET /lessons`                  | ✅                                |
| `GET /activities`               | ✅                                |
| `GET /exercises`                | ✅                                |
| `GET /questions`                | ✅                                |
| `POST /progress`                | 🚧 501 (validated, contract-only) |

Standard response envelope + domain-error→HTTP mapping (`src/lib/http/response.ts`).
Route handlers contain **no business logic** — they parse query/body and call services.
`GET /questions` returns choices but **never the answer key**.

## 5. Folder structure (hexagonal)

```
src/modules/learning/
├── domain/           entities.ts · errors.ts · pagination.ts        (framework-free)
├── application/
│   ├── ports.ts      repository interfaces
│   └── services/     course · lesson · exercise · question · learning-path · progress
└── infrastructure/
    ├── mappers.ts    Prisma row → domain
    ├── repositories.ts   Prisma implementations of ports
    └── container.ts  composition root (wires services ↔ repos ↔ prisma)

Presentation:
  src/app/api/v1/**                 route handlers (courses/units/lessons/…)
  src/app/(dashboard)/learn/**      Course Explorer · Unit · Lesson · Player
  src/app/(dashboard)/progress      Progress
  src/components/learn/**           presentational placeholders
  src/lib/http/response.ts          envelope + error mapping
```

Dependencies point inward (presentation → application → ports; infrastructure implements
ports). Mirrors the future `packages/learning-engine` so extraction is a move, not a
rewrite (D-0014).

## 6. UI (placeholders — layout only)

Course Explorer (`/learn`), Unit Detail (`/learn/units/[unitId]`), Lesson Detail
(`/learn/lessons/[lessonId]`), Learning Player (`/learn/lessons/[lessonId]/play`),
Progress (`/progress`). All behind auth (dashboard shell + middleware). **No demo data** —
empty states only. Shared components `LearnPlaceholder`, `EmptyState`,
`LearningPlayerShell` keep pages free of markup/logic.

## 7. Key technical decisions

See [DECISIONS.md](../docs/DECISIONS.md) D-0009…D-0016:

1. Engine is content-type-agnostic (not vocab/grammar).
2. Content versioning via `LessonVersion`; `Lesson.currentVersionId` points at published.
3. `Difficulty`/`Tag`/`Skill` as tables; `*Type` as enums (structural, not business).
4. `Answer` = answer key; user submissions deferred to the progress domain.
5. `ProgressService` interface-only → `POST /progress` returns 501.
6. Hexagonal layering in `src/modules/learning`; no logic in pages/routes.
7. Soft delete on user-facing content; API under `/api/v1`.

## 8. Verification

| Check       | Command                | Result                                 |
| ----------- | ---------------------- | -------------------------------------- |
| Type safety | `npm run typecheck`    | ✅ 0 errors                            |
| Lint        | `npm run lint`         | ✅ clean                               |
| Format      | `npm run format:check` | ✅ clean                               |
| Build       | `npm run build`        | ✅ 8 API routes + 5 learning UI routes |
| Prisma      | `prisma validate`      | ✅ valid; client generated (30 tables) |

Not run here (no DB): `prisma migrate`, and live queries — deferred to Sprint 3.2.

## 9. Next sprint (3.2)

Authoring write paths (permission-gated) + draft→publish version flow +
`/skills`/`/learning-paths`/`/lessons/{id}` + Vitest (services/repos) against a real
Postgres. See [NEXT_TASK.md](../docs/NEXT_TASK.md).
