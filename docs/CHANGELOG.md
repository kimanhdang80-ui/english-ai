# CHANGELOG — English AI

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/); project follows Semantic Versioning once code ships.

## [Unreleased]

### Changed — DEPLOY-01 (Vercel deploy prep)

- **Prisma `directUrl`** — `schema.prisma` datasource now declares `directUrl = env("DIRECT_URL")`
  so `prisma migrate deploy` uses a direct (non-pooled) connection on Supabase; runtime keeps the
  pooled `DATABASE_URL`. `DIRECT_URL` is now required in every environment (set equal to
  `DATABASE_URL` when there is no pooler).
- **Release scripts** — added `prisma:migrate:deploy` and **`db:release`** (runs `prisma migrate
deploy` then the idempotent seed). Kept **out** of `build` so local/CI builds stay DB-free and
  deterministic.
- **`.env.example`** — added `DIRECT_URL` (required) + `AI_CIRCUIT_FAILURE_THRESHOLD` /
  `AI_CIRCUIT_COOLDOWN_MS` (RC-04 drift).
- **Docs** — `VERCEL_DEPLOY.md` (GitHub→Vercel→Supabase→Production) + `DEPLOY_CHECKLIST.md`
  (step-by-step). Closes the DEPLOYMENT_AUDIT §18 blockers.
- **No feature / UI / refactor.** `npm run build` passes (175 tests, typecheck, lint, format green);
  the only build warning is a non-blocking Prisma 6→7 `package.json#prisma` forward-deprecation.

### Added — RC-04 (AI Production Ready)

- **Circuit breaker** — `CircuitBreakerProvider` decorator wraps the retry chain per provider
  (`Breaker(Retrying(base))`): opens after `AI_CIRCUIT_FAILURE_THRESHOLD` (5) consecutive
  failures, half-opens after `AI_CIRCUIT_COOLDOWN_MS` (30s); open state throws `CircuitOpenError`
  (non-retryable) so `FallbackProvider` fails over immediately.
- **Cost** — `config/pricing.ts` (`MODEL_PRICING` + `computeCostMicroUsd`); `AiTextService`
  computes per-call cost and persists it to `ai_usage_logs.cost_micro_usd` (existing column — **no
  migration**). See `AI_COST_GUIDE.md`.
- **Streaming** — optional `AIProvider.stream()` on Claude (`content_block_delta`) and OpenAI
  (`choices[].delta.content`) via a pure SSE parser (`parseSseBuffer`/`readSseData`); decorators
  delegate (no mid-stream retry; circuit counts stream outcome; fallback switches only at
  connect-time). No learning-UI consumer yet (kept in scope).
- **AI health check** — `AiHealthService` + `GET /api/health/ai` (provider/config, circuit state,
  24h success/fallback/latency/cost; 503 only when degraded). See `AI_HEALTHCHECK.md`.
- **AI Metrics Dashboard** — `AiMetricsService` + `PrismaAiMetricsRepository` (Prisma `groupBy`
  over `ai_usage_logs`) + admin page `/admin/ai-metrics`: Requests · Success Rate · Fallback Count
  · Failed · Avg Latency · Tokens · Cost + per-model/per-feature breakdowns.
- **Config:** `AI_CIRCUIT_FAILURE_THRESHOLD`, `AI_CIRCUIT_COOLDOWN_MS` added to env.
- **Tests:** +22 (circuit breaker, cost/pricing, SSE parser + streaming decorators, metrics
  `summarizeUsage`, health service) → **175 total**.
- **No learning feature / no learning-UI / no Learning-Engine change; no DB migration.** Reports:
  `AI_PRODUCTION_READY_REPORT.md`, `AI_HEALTHCHECK.md`, `AI_COST_GUIDE.md`. Typecheck · lint ·
  test · build · format green; live provider + metrics verification is deploy-time (keys + DB).

### Added — RC-03 (Persistence Production Ready)

- **Retired every in-memory runtime repository** (ADR-0005) — new additive migration
  `20260702010000_persistence_stores` adds **8 tables** (39 → 47), generated drift-free via
  `prisma migrate diff`:
  - `learning_sessions`, `lesson_plans`, `mission_progress` — replace the daily-loop/mission
    in-memory stores; cascade FK → `profiles`.
  - `content_tracks`, `content_missions` — the **Mission Library in the DB**; the runtime reads
    missions from Postgres (Zod-validated), the authored JSON is now **seed-only**.
  - `prompt_templates`, `prompt_versions`, `ai_generation_jobs` — replace the AI in-memory registry
    and generation-history stores.
- **Prisma repositories** (7): `PrismaSessionRepository`, `PrismaLessonPlanRepository`,
  `PrismaMissionRepository` (+ `mission-content-mapper`), `PrismaUserProgressRepository`,
  `PrismaPromptTemplateRepository`, `PrismaGenerationHistoryRepository`. Containers (`daily-loop`,
  `ai`, `learning/mission`) swap in-memory → Prisma; **ports unchanged** (no service/UI/UX change).
- **Seed** extended: Mission Library (4 tracks × 10 missions) + prompt templates (from the code
  registry). Idempotent upserts. New node loader `prisma/data/mission-library.ts`.
- **Rendering:** `(admin)` segment marked `force-dynamic` (now reads live DB data; permission-gated).
- **Dead code removed:** `InMemorySessionRepository` deleted; the remaining in-memory classes are
  annotated as **test-only fakes** (not wired into any container).
- **Tests:** +20 offline persistence-invariants/mapper checks → **153 total**. **DB gate:** ADR-0005
  (impact + migration + rollback). Report: `PERSISTENCE_READY_REPORT.md`.
- Typecheck · lint · test · build · format · `prisma validate` green; apply + seed are deploy-time
  (no DB here). Session/mission-progress **writers** remain a Sprint 8.2 hookup (noted).

### Added — RC-02 (Auth Production Ready)

- **Supabase→app identity sync trigger** (ADR-0004) — new migration
  `20260702000000_auth_user_sync` closes the #1 auth blocker (PA-C2 / DEBT-008):
  - `handle_new_user()` (`AFTER INSERT ON auth.users`) creates the `profiles` row (id = auth id,
    email, `display_name` from sign-up metadata) and assigns the default **`student`** role;
    `SECURITY DEFINER`, idempotent (`ON CONFLICT DO NOTHING`).
  - `handle_user_delete()` (`AFTER DELETE ON auth.users`) deletes the profile → cascades to owned
    rows (data-layer account teardown; audit/AI logs SetNull).
- **DB gate:** ADR-0004 with impact + backfill (for pre-trigger users) + rollback.
- **Tests:** +6 offline auth-invariants/migration checks (default role, role/permission integrity,
  trigger migration shape) → **133 total**.
- **No application code / UI / UX / schema change** — the triggers fill the gap `signUpAction` and
  `getCurrentUser`/`getUserAccess` already assumed. Self-service "delete account" UI remains out of
  scope (feature). Report: `AUTH_READY_REPORT.md`.
- Typecheck · lint · build (26/26) · `prisma validate` green; apply is deploy-time (no DB here).

### Added — Task 05 (Complete Mission Flow)

- **Full mission learning flow** at `/learn/mission/[missionId]` over the authored Mission Library
  (Task 04): **Today's Goal → Warmup → Vocabulary → Dialogue → Practice → Quiz → Reflection →
  Session Summary → Review Queue → Dashboard** — `src/components/mission/*`.
  - **Warmup** (30–60s, 3 words), **Practice** (Fill-Blank ×3 + **Arrange-Sentence** ×≤2 derived
    from dialogue + Matching ×2), **Reflection** (self-assessment), **Session Summary**
    (Mission · Time · Accuracy · Words Learned · Need Review · Tomorrow's Goal), **Review Queue**
    (review-focus words queued).
  - Pure helpers `src/lib/mission-flow/{flow,arrange}.ts` (phase order, accuracy, deterministic
    sentence scramble); server-only content loader `src/content/mission-loader.ts` (fs + Zod);
    Missions browser `/learn/missions` + "Missions" nav link.
- **No Learning Model / Learning Engine / Database / Mission Library change, no new missions.**
  Scoring + review-queue update are session-scoped (library isn't in the DB; persistence is the V2
  migration's job). Daily loop untouched.
- **Tests:** +5 (flow phases/accuracy, arrange scramble/correctness) → **127 total**.
  Typecheck · lint · build (26/26) · format green. Docs: **`docs/MISSION_FLOW.md`** (learning
  journey, state flow, user journey, decision points) + `reports/task-05-complete-mission-flow.md`.

### Added — Task 04 (Mission Library — first content set)

- **First Mission Library**: 4 tracks × 10 missions = **40 missions** authored as structured
  JSON under `content/tracks/*.json` + `content/missions/<track>/<id>.json` — **content only**,
  no Learning Engine / DB / API change, not hard-coded in components.
  - Tracks: **General**, **Business**, **Construction**, **Travel** English (all A1).
  - Each mission: Title · Goal · Difficulty · Estimated Time · Prerequisite · Completion Criteria
    (quiz ≥ 80%) · Vocabulary (8: word/IPA/meaning[VN]/example) · Dialogue (8–10 lines) ·
    Exercises (5 MC + 3 fill-blank + 2 matching) · Review Focus (5).
- **Content contract + gate:** `src/content/mission-schema.ts` (Zod) + `mission-library.test.ts`
  (loads + validates all files: counts, id/prerequisite chains, review-focus integrity, MC answers).
- **Totals:** 320 vocabulary, 380 dialogue lines, 400 exercises (200 MC / 120 fill-blank / 80
  matching), 200 review-focus words. Tests **122** (+8). Typecheck · lint · build · format green.
- Docs: **`docs/MISSION_LIBRARY.md`** (tracks, missions, dependencies, learning paths, totals,
  gaps) + `reports/task-04-mission-library.md`.

### Added — Task 03 (Mission Engine — Learning Model V2)

- **Mission Engine** in `src/modules/learning/**/mission` — Mission is the center of the model;
  Vocabulary / Dialogue / Quiz / Review are **Activities** (Listening / Speaking are declared
  **placeholders**, interface-only). Implemented per `docs/migration/LEARNING_MODEL_V2.md` (no new
  framework, no redesign).
  - **Domain:** `Mission`, `MissionActivity`, `Exercise`, `Question` (+ `Answer`, `Hint`,
    `explanation`, `Difficulty`), `CompletionRule`, `LearningTrack`, `MissionState`; pure
    `evaluateCompletion`; `ACTIVITY_BUILDERS` extension registry (add a skill = add a builder).
  - **Application:** `MissionService` (facade), `MissionPlanner` (decides which mission from Goal ·
    Review Queue · Progress · Track), `ActivityPlanner` (canonical order + availability),
    `CompletionService` (rule → status + lifecycle state).
  - **Infrastructure:** in-memory `MissionRepository` / `UserProgressPort` skeletons +
    `missionEngine` container; `wrapMissionAsLesson` adapter (**Lesson wraps Mission**).
- **Exercise types:** multiple_choice · fill_blank · match · arrange. **Mission lifecycle:**
  locked → available → in_progress → completed (derived from progress).
- **Backward compatible / no rewrite:** legacy Lesson engine + daily loop untouched; engine is a
  separate container; storage is in-memory (durable Prisma repos land via the migration DB gate).
- **Tests:** +15 (completion rule, activity builders, planner/activity-planner/service) → **114 total**.
  Typecheck · lint · build · format green. Docs: **`docs/MISSION_ENGINE.md`** (lifecycle, text state
  diagram, decision rules, flow, extension points) + `reports/task-03-mission-engine.md`.

### Added — Task 02 (Daily Lesson Generator — Learning Model V2)

- **Daily Lesson Generator** replaces the fixed lesson builder with a deterministic planning
  pipeline (Goal → Track → Mission → Activities → Lesson) in `src/modules/daily-loop`:
  - **Rule Engine** (`domain/rule-engine.ts`) decides the lesson shape from review load +
    time budget (`Review > 20 → no new words`; `Review < 5 → new mission`; else balanced;
    then time-boxed to the daily minutes). Default decider **and** fallback.
  - **Goal / Mission / Activity selectors** (`domain/*-selector.ts`) — derive `DailyGoal`,
    Track+Mission (set index from progress), and the ordered activities
    (Vocabulary → Dialogue → Quiz → Review) + completion criteria.
  - **Lesson Planner Service** — reads real signals → decides (AI advisor via
    `LessonPlannerAiPort`, else Rule Engine) → assembles the `LessonPlan` → **saves it**.
  - `DailyLessonService` now **materializes** the plan into a backward-compatible `DailyLesson`
    (real corpus content; review-focus days source study cards from the due set).
- **Each lesson carries** Mission Title, Learning Goal, Estimated Time, Activities, Completion
  Criteria, Difficulty, and `decidedBy` — surfaced via optional `DailyLesson.plan` (UI unchanged).
- **No hard-code / no mock / no random:** structure from named rules, content from the corpus,
  deterministic selection. **AI decides structure only** (not wired yet → Rule Engine is default;
  any AI failure/decline falls back). **No big DB change** (plan saved via in-memory skeleton).
- **Tests:** +18 (rule engine, selectors, planner service, plan-driven lesson) → **99 total**.
  Typecheck · lint · build · format green. Docs: **`docs/DAILY_LEARNING_ALGORITHM.md`** (decision
  tree, fallback, rules, ASCII flowchart) + `reports/task-02-daily-generator.md`.

### Changed — Task 01 (Learning Dashboard redesign)

- **Dashboard is now a Learning Dashboard**, not a stats page — it answers one question,
  "what should I do today?". Rebuilt `/dashboard` in the mandated order: Greeting (hello +
  streak + today's goal) → **Today's Mission** (single `Start today's lesson` CTA) →
  Today's Review (Need review / Mastered) → **AI Coach card** → Weekly Progress (7-day bar
  chart) → Weak Words → Recent Activity.
- **Removed:** the `Continue Learning` card, the standalone progress-bar widget, and the
  4-way review-queue breakdown (stats-only / duplicate widgets).
- **AI Coach card:** deterministic **mock** message (`buildCoachMessage`, `src/lib/dashboard/`)
  built from real signals — a swap seam for a real AI provider later (no UI change needed).
- **New states:** `Skeleton` UI primitive + `dashboard/loading.tsx` (skeleton) +
  `dashboard/error.tsx` (friendly retry). Mobile-first, responsive, dark-mode.
- **New presentational components** in `src/components/dashboard/` (7 sections), all server
  components; the dashboard no longer builds the daily lesson (avoids AI in SSR — the
  mission summary uses fixed lesson-plan constants).
- **No DB/API/package change.** Reads only existing services. Typecheck · lint · build ·
  81 tests · format green. See `reports/task-01-dashboard.md` + `DASHBOARD_BEFORE_AFTER.md`.

### Added — Milestone 1 (Real AI — provider integration)

- **AI provider pattern** (`src/modules/ai/infrastructure/providers/`): `AIProvider`
  interface + `ClaudeProvider` / `OpenAIProvider` (Anthropic Messages / OpenAI Chat via
  `fetch`, **no SDK**), `UnconfiguredProvider`, and composable resilience decorators
  `RetryingProvider` (timeout + exponential backoff) and `FallbackProvider`, assembled by
  **`ProviderFactory`** from config. Keys come only from the environment.
- **Real AI capabilities** (`AiTextService`): vocabulary **explanation**, example
  **generation**, and short-answer **feedback** — each renders a versioned prompt template,
  calls the provider-agnostic `LlmPort`, validates output, logs usage, and **degrades to a
  deterministic fallback** when AI is off/failing. Three new prompt templates added.
- **Replaced mocks:** the daily loop's `ExplanationPort` now resolves to a real
  `AiExplanationAdapter` when AI is configured (else the deterministic `MockExplanationAdapter`).
  `LlmPort` container binding swapped from the stub to the real provider chain.
- **DB (gate — ADR-0003):** new append-only **`ai_usage_logs`** table (feature/provider/
  model/tokens/latency/status/error) + migration `20260701010000_ai_usage_logs` + Prisma
  repo; a **no-op** repo when no DB is configured, so AI runs without persistence.
- **Config:** `AI_PROVIDER`, `AI_FALLBACK_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
  `AI_TIMEOUT_MS`, `AI_MAX_RETRIES` (validated in `src/lib/env.ts`; `.env.example` updated).
- **Tests:** +19 (retrying/fallback/factory providers, `AiTextService`, explanation adapter)
  → **81 total**. Typecheck · lint · build · format green.
- **Docs:** new **`docs/AI_INTEGRATION_GUIDE.md`** (keys, config, cost, provider switch);
  ADR-0003; DECISIONS D-0029…D-0032; AI_ENGINE §3.3 + DATABASE `ai_usage_logs` updated;
  debt DEBT-014 → PARTIAL, +DEBT-018…021.
- **No architecture, UI, or Learning-Engine change** — providers are adapters behind the
  existing port; capabilities sit behind existing seams.

### Added — Sprint 8.1 (Daily Learning Loop — MVP)

- **`src/modules/daily-loop`** (composition, hexagonal): domain (status mapping →
  NEW/LEARNING/REVIEW/MASTERED, pure streak), application (ports + `DailyLessonService`,
  `ReviewQueueService`, `StreakService`, `LearningHistoryService`), infrastructure
  (**`MockExplanationAdapter`** = AI seam, `PrismaReviewActivityRepository` derived from
  `review_history`, in-memory session skeleton, vocabulary lesson source, container).
- **MVP Dashboard** (`/dashboard` rebuilt): Today's Lesson, Today's Review, Progress,
  Streak, Continue Learning, Review Queue breakdown, Recent activity.
- **Daily lesson** (`/learn/today`): study 10 words (flip + add to your set) → 5-question
  quiz → results. `DailyLessonPlayer` client component; "Today" added to nav.
- **Quiz results:** `QuizSession` now reports score + reviews wrong answers with the
  correct answer + a (mock) **explanation**; reused by the daily lesson.
- **Tests:** +12 (streak, status mapping, daily-lesson assembly) → **62 total**.
- **No AI, no new DB tables, no framework expansion** — streak/activity derived from
  existing `review_history`; explanation via swappable `ExplanationPort` mock.
- Docs: `DECISIONS.md` D-0025…D-0028; debt DEBT-016/017; new **`docs/MVP_CHECKLIST.md`**.

### Added — Sprint 7.1 (AI Lesson Generator Foundation — no AI call)

- **`src/modules/ai`** (hexagonal): domain (`entities`, `PromptRenderer`,
  `TokenEstimator`, `ContentValidator`, `DifficultyAdjuster`), application (ports —
  `LlmPort`/repositories — + services `LessonGeneratorService`, `PromptBuilder`,
  `ContentValidatorService`, `DifficultyService`, `TokenEstimator`, `PromptVersionService`),
  infrastructure (in-memory skeleton repos, **`StubLlmAdapter`**, container).
- **Prompt system:** versioned template registry (`config/prompt-templates.ts`) with
  `{{WORD}}/{{TOPIC}}/{{LEVEL}}/{{LANGUAGE}}/{{GOAL}}/{{STYLE}}` tokens; model registry
  (`config/models.ts`). **No prompt strings inline in services** (D-0023).
- **Validation:** empty prompt, missing variable, output too long, wrong format.
- **Admin UI placeholders:** Prompt Library, Generator, Prompt Versions, Generation
  History (+ admin sub-nav). Prompt **preview** works AI-free; generation returns 501.
- **Tests:** +16 (prompt renderer, content validator/estimator, generator preview/stub) →
  **50 total**.
- **No provider SDK, no OpenAI/Claude call** — `LlmPort` stub throws `NotImplementedError`.
- Docs: `AI_ENGINE.md` foundation note; `DECISIONS.md` D-0022…D-0024; debt DEBT-014/015.

### Added — Sprint 6.1 (Implement Vocabulary per spec)

- **Vitest test suite** (34 unit tests): SRS scheduler (`srs.test.ts`), quiz generator
  (`quiz.test.ts`), pagination (`pagination.test.ts`), and the user-vocabulary service with
  mocked ports (`user-vocabulary-service.test.ts`) — covering `testcases.md` FC/EC. Wired
  `npm test` into CI. **Resolves DEBT-001.**
- **Baseline migration** `prisma/migrations/20260701000000_init/` (Prisma-generated DDL,
  39 tables) + `migration_lock.toml` — applies on a live DB (partially resolves DEBT-004).
- **Seed expanded to 100 A1 words** (`prisma/data/a1-vocabulary.ts`).
- **`reports/spec-review.md`** — conformance review (module conforms) + 4 non-blocking spec
  observations (SR-01…SR-04); **no spec changed** (Project OS §0.1).
- Sprint report + six governance reports under `reports/sprint-06.1/`.

### Changed — Sprint 6.1

- **Refactor (DEBT-005):** extracted shared `toReviewCard` + `userVocabularyWithVocabularyInclude`
  in the vocabulary repository mappers (removes `listDue`/`listStudySet` duplication).
- CI now runs a unit-test job (partially resolves DEBT-012).
- Removed obsolete `prisma/*.generated.sql` reference artifacts (superseded by the migration).

### Added — Project OS v1 (process governance, docs only)

- **`docs/PROJECT_OS.md`** — the Development Operating System: start-of-sprint reading,
  pre-code checklist, post-code pipeline (typecheck→lint→build→review→refactor→docs→
  state→changelog→next→reports), DB/API change gates, spec-supremacy, "log don't fix"
  policy, priorities (Maintainability · Scalability · Clean Arch · SOLID · DDD · Prod-ready).
- **`reports/_templates/`** — the six mandatory per-sprint governance reports:
  `review`, `architecture-review`, `technical-debt`, `risk-analysis`,
  `performance-review`, `security-review`.
- **`reports/technical-debt.md`** — living debt ledger, seeded with 12 real items
  observed across Sprints 1–5.1 (DEBT-001…012) — **logged, not fixed**.
- **`docs/REFACTOR_PLAN.md`** — scheduled/backlogged remediation for the ledger.
- **`CLAUDE.md`** Prime Directives updated to reference PROJECT_OS (spec supremacy,
  log-don't-fix, gates).

### Added — Sprint 5.1 (Vocabulary specification — docs only)

- **`specs/vocabulary/`** — full module specification (9 documents):
  `overview.md`, `database.md`, `api.md`, `ui.md`, `workflow.md`, `validation.md`
  (V-01…V-41), `testcases.md` (30 functional + 25 edge), `acceptance-criteria.md`
  (10 user stories + Definition of Done), `implementation-plan.md` (11 steps).
- **No code, schema, or migration changes** — specification sprint only. PROJECT_STATE /
  NEXT_TASK updated to run Sprint 4.2 against this spec.

### Added — Sprint 4.1 (Vocabulary MVP — first usable feature)

- **Vocabulary domain** (Prisma, 9 tables): `Vocabulary`, `VocabularyMeaning`,
  `VocabularyExample`, `VocabularyPronunciation`, `VocabularyAudio`, `VocabularyImage`,
  `VocabularyTag` (→ shared `Tag`), `UserVocabulary`, `ReviewHistory` + enums
  (`PartOfSpeech`, `VocabularyStatus`, `ReviewRating`, `Accent`).
- **`src/modules/vocabulary`** (domain/application/infrastructure): entities, a
  deterministic **SM-2-lite SRS scheduler** (pure, no AI), a **quiz generator** (4 kinds),
  ports, `VocabularyService` + `UserVocabularyService`, Prisma repos + container.
- **API** (`/api/v1`): `vocabularies`, `vocabularies/{id}`, `user-vocabulary` (POST add,
  PATCH review/favorite), `user-vocabulary/stats`, `reviews/today`.
- **UI** (responsive): Vocabulary List (search + add), Detail, **Flashcard** session
  (Word/IPA/POS/Meaning/Example/Audio/Image + Know/Review-Again/Favorite), **Quiz**
  (Multiple Choice, Fill-in-the-Blank, Match, True/False), Today's Review, and a real
  **Progress** page (total/learned/due/completion). Nav + route protection updated.
- **Seed:** ~60 real **A1** English words with meanings, IPA, examples, and Vietnamese
  translations (`prisma/data/a1-vocabulary.ts`); seed also creates CEFR **A1**.
- **`src/lib/errors.ts`** shared `DomainError` hierarchy; browser `api-client`.

### Changed — Sprint 4.1

- HTTP error mapper now handles `UNAUTHENTICATED` (401) and `CONFLICT` (409).
- Updated `DATABASE.md` §3.3, `API.md` §6, `DECISIONS.md` (D-0017…D-0021).

### Added — Sprint 3.1 (Learning Engine core)

- **Learning Engine domain** (Prisma): `Course`, `Unit`, `Lesson`, `LessonVersion`,
  `Activity`, `Exercise`, `Question`, `Choice`, `Answer`, `Difficulty`, `Tag`,
  `LessonDependency`, `LearningPath`, `LearningPathStep`, `LearningObjective`, plus join
  tables — versioned content tree, soft delete, indexes, cascade rules (30 tables total).
- **Layered module** `src/modules/learning`: `domain/` (entities, errors, pagination),
  `application/` (services + repository ports), `infrastructure/` (Prisma repos, mappers,
  container). Presentation stays in `src/app`.
- **Services (read skeletons):** Course, Lesson, Exercise, Question, LearningPath;
  `ProgressService` is contract-only (501).
- **API** under `/api/v1`: `courses`, `courses/{id}`, `units`, `lessons`, `activities`,
  `exercises`, `questions`, `progress` — standard envelope + domain-error → HTTP mapping.
- **Placeholder UI**: Course Explorer, Unit Detail, Lesson Detail, Learning Player,
  Progress (layout only, no demo data); `learn`/`progress` added to nav + route protection.
- **`docs/DECISIONS.md`** engineering decision log (D-0009…D-0016).

### Changed — Sprint 3.1

- Content schema **superseded** Sprint-1 `course_units`→`units` and the single
  `lesson_activities` table → versioned Activity→Exercise→Question tree. Removed the
  temporary `prisma/*.generated.sql` from tracking (gitignored).
- Updated `DATABASE.md` §3.2, `API.md` §5, `SYSTEM_ARCHITECTURE.md` §6.

### Added — Sprint 2.1 (Authentication foundation)

- **Supabase Auth flows** via Next Server Actions: sign up, login, logout, forgot
  password, reset password, email verification/resend; `/auth/callback` PKCE route;
  automatic session refresh in `middleware.ts`.
- **Permission-based RBAC:** `permissions` catalog + roles (admin, teacher,
  content_manager, student) with default mapping; DB-driven access resolver; seed script.
- **Route protection:** Edge middleware (authentication) on `/dashboard`, `/profile`,
  `/settings`, `/admin` + Node-runtime `requirePermission()` (authorization).
- **Auth UI** (per UI_GUIDELINE): Login, Register, Forgot/Reset password, Verify email,
  Profile, Settings, Admin console; new `Card`, `Label`, `Alert` primitives.
- **Security:** sliding-window rate limiter (pluggable store), CSRF via Server Actions,
  Supabase cookie strategy, zod-based environment validation, and an `audit_logs` trail.
- **Health endpoint** now reports `config.supabase` / `config.database`.

### Changed — Sprint 2.1

- **Prisma schema → Supabase-Auth-centric identity** ([ADR-0002](./adr/ADR-0002.md)):
  added `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles`,
  `user_settings`, `user_devices`, `user_sessions`, `audit_logs`,
  `notification_preferences`. **Removed** Sprint 1 `User`/`UserProfile`/`AuthAccount`.
- Updated `DATABASE.md` §3.1, `API.md` §2, and `SYSTEM_ARCHITECTURE.md` §9 to the
  implemented design.
- Added deps: `zod`, `server-only`; dev: `tsx` (Prisma seed runner).

### Added — Sprint 1.2 (Architecture consolidation)

- **`docs/ARCHITECTURE_EVOLUTION.md`** — current architecture, split milestones
  (worker/realtime/data/API), and objective transition criteria.
- **Reserved monorepo scaffolding** with READMEs: `apps/{web,worker}` and
  `packages/{shared,ui,ai,database,learning-engine,srs}` — so a future split is a
  move, not a rewrite.
- **`docs/adr/README.md`** — ADR process + unified template + index.

### Changed — Sprint 1.2

- **Standardized ADR** to a unified template (Context · Decision · Alternatives ·
  Consequences · Future Review); renamed `adr/0001-nextjs-fullstack-supabase.md` →
  `adr/ADR-0001.md` and updated all references.
- **SYSTEM_ARCHITECTURE.md** now reflects the actual Stage-0 layout + reserved target,
  and marks the deployment model as current (Vercel/Railway/Supabase) vs target (K8s).

### Added — Sprint 1 (Foundation)

- **Project scaffold:** Next.js 15 (App Router) + React 19 + TypeScript (strict).
- **Styling & theme:** Tailwind CSS, shadcn/ui primitives (Button, Input), semantic
  color tokens, and dark mode via `next-themes` (light/dark/system).
- **Pages (placeholders, no business logic):** minimal Landing `/`, Login `/login`,
  Dashboard `/dashboard`, and a `/api/health` route.
- **Data:** initial Prisma schema (identity + content core) + Prisma client singleton.
- **Auth scaffolding:** Supabase browser/server clients (`@supabase/ssr`) — no auth logic yet.
- **Tooling:** ESLint (+ Next/TS rules), Prettier (+ Tailwind plugin), Husky pre-commit,
  lint-staged, `.editorconfig`, `.nvmrc`, path alias `@/*`.
- **Infra:** Dockerfile (standalone output), `docker-compose.yml` (Postgres + Redis),
  GitHub Actions CI (lint · typecheck · format · build), Railway + Vercel configs.
- **Env:** `.env.example` with a fail-fast env accessor.
- **Docs:** `README.md`, ADR `adr/ADR-0001.md`, `SPRINT_1_REPORT.md`.

### Changed — Sprint 1

- **Architecture decision (ADR-0001):** MVP adopts a single Next.js full-stack app with
  Supabase Auth (Vercel + Railway), superseding the NestJS monorepo for now.

---

<!--
Changelog discipline (per CLAUDE.md §7):
- Add an entry in the SAME PR as the change.
- Group under Added / Changed / Deprecated / Removed / Fixed / Security.
- Cut a versioned section when a milestone/release ships.
-->
