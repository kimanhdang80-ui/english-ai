# API.md — English AI

> REST API **specification** (contract only — no implementation).
> Base URL: `https://api.englishai.app/api/v1` · Realtime: `wss://rt.englishai.app`

---

## 1. Conventions

- **Style:** RESTful, resource-oriented, JSON. Versioned via URL prefix `/api/v1`.
- **Auth:** `Authorization: Bearer <access_token>` (JWT). Public endpoints noted explicitly.
- **Content-Type:** `application/json; charset=utf-8` (media upload uses signed URLs, not multipart through the API).
- **IDs:** UUID strings.
- **Casing:** JSON fields `camelCase`; query params `camelCase`.
- **Idempotency:** mutating POSTs that could retry accept `Idempotency-Key` header.
- **Time:** ISO-8601 UTC.

### 1.1 Standard Response Envelope

```json
// success
{ "data": { ... }, "meta": { "requestId": "..." } }
// list
{ "data": [ ... ], "meta": { "page": 1, "pageSize": 20, "total": 137, "requestId": "..." } }
// error
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ ... ], "requestId": "..." } }
```

### 1.2 Pagination / Filtering / Sorting

- Cursor pagination preferred for feeds: `?cursor=<opaque>&limit=20`.
- Offset pagination for admin lists: `?page=1&pageSize=20`.
- Filtering: `?filter[skill]=vocabulary&filter[level]=A2`.
- Sorting: `?sort=-createdAt`.

### 1.3 Status Codes

`200` OK · `201` Created · `202` Accepted (async job) · `204` No Content ·
`400` validation · `401` unauthenticated · `403` forbidden · `404` not found ·
`409` conflict · `422` unprocessable · `429` rate limited · `500` server.

### 1.4 Errors (canonical codes)

`VALIDATION_ERROR`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, `RATE_LIMITED`, `PAYMENT_REQUIRED`, `AI_UNAVAILABLE`, `JOB_FAILED`, `INTERNAL`.

### 1.5 Async Pattern (AI & media)

Long-running work returns `202` with a job handle:

```json
{ "data": { "jobId": "…", "status": "queued", "pollUrl": "/jobs/{jobId}" } }
```

Client polls `GET /jobs/{jobId}` or subscribes via WebSocket `job:{jobId}`.

---

## 2. Authentication — **IMPLEMENTED via Supabase Auth + Next Server Actions (Sprint 2.1)**

> Authentication is **not** a set of hand-rolled REST endpoints. It uses **Supabase
> Auth** driven through **Next.js Server Actions** (CSRF-protected, POST-only,
> Origin-checked) plus one callback route. Sessions are cookie-based (Supabase SSR),
> refreshed automatically by middleware. See
> [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §9 and [ADR-0002](./adr/ADR-0002.md).

| Mechanism            | Surface                                  | Description                                                 |
| -------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| Sign up              | Server Action `signUpAction`             | Email/password → Supabase sends verification email          |
| Login                | Server Action `loginAction`              | `signInWithPassword` → session cookies; safe `redirectTo`   |
| Logout               | Server Action `logoutAction`             | `signOut` → clears cookies → `/login`                       |
| Forgot password      | Server Action `forgotPasswordAction`     | `resetPasswordForEmail` (no account enumeration)            |
| Reset password       | Server Action `resetPasswordAction`      | `updateUser({ password })` in a recovery session            |
| Resend verification  | Server Action `resendVerificationAction` | `auth.resend({ type: 'signup' })`                           |
| Email/OAuth callback | `GET /auth/callback?code=&next=`         | Exchanges PKCE `code` for a session; validates local `next` |
| Refresh session      | `middleware.ts` (every request)          | Supabase SSR refreshes/rotates the session cookie           |

- **Rate limited:** login (5/min), sign-up (3/min), password reset & resend (3/15min) per IP.
- **Audited:** every auth event is written to `audit_logs`.
- **Degrades gracefully:** when Supabase env is absent, actions return a friendly
  "preview mode" message instead of failing (mock-friendly).

_(A future extracted API service, per ADR-0001, may additionally expose OAuth provider
endpoints and token flows for non-web clients.)_

### 2.1 Authorization (RBAC)

- Enforced by **permission**, never role name ([ADR-0002](./adr/ADR-0002.md)).
  Permissions are `<resource>.<action>`; roles (admin/teacher/content_manager/student)
  bundle them via `role_permissions`.
- **Two layers:** Edge `middleware.ts` enforces _authentication_ on `/dashboard`,
  `/profile`, `/settings`, `/admin`; Node-runtime layouts enforce _authorization_ via
  `requirePermission(<code>)` (e.g. `admin.panel_access` for `/admin`).
- Server helpers: `getCurrentUser()`, `requireUser()`, `requirePermission()`;
  access resolved from the DB as `{ roles, permissions }`.
- Health/diagnostics: `GET /api/health` returns `{ config: { supabase, database } }`.

## 3. Users & Profile

| Method | Path                                 | Description                                                                 |
| ------ | ------------------------------------ | --------------------------------------------------------------------------- |
| GET    | `/me`                                | Current user + profile                                                      |
| PATCH  | `/me/profile`                        | Update display name, native language, goal, daily minutes, timezone, locale |
| GET    | `/me/settings` / PATCH               | Notification & privacy settings                                             |
| POST   | `/me/onboarding`                     | Submit onboarding answers (goal, level self-assessment, time budget)        |
| DELETE | `/me`                                | Request account deletion (GDPR workflow)                                    |
| GET    | `/me/devices` / POST / DELETE `{id}` | Manage push devices                                                         |

## 4. Placement & Onboarding

| Method | Path                            | Description                                        |
| ------ | ------------------------------- | -------------------------------------------------- |
| POST   | `/placement/start`              | Begin adaptive placement test → returns first item |
| POST   | `/placement/{sessionId}/answer` | Submit answer → next item or completion            |
| GET    | `/placement/{sessionId}/result` | Estimated CEFR + initial weakness profile          |

## 5. Learning Engine (Content) — **SKELETON IMPLEMENTED (Sprint 3.1)**

> Read-oriented contract for the generic content tree, live under `/api/v1`. Handlers
> follow domain → application → infrastructure layering (route handlers contain no
> business logic; see [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §6). Responses
> use the standard envelope (§1.1). Progress is contract-only (501) this sprint.

| Method | Path                   | Status | Description                                                  |
| ------ | ---------------------- | ------ | ------------------------------------------------------------ |
| GET    | `/api/v1/courses`      | ✅     | List courses (`?track&status&cefrLevelId&page&pageSize`)     |
| GET    | `/api/v1/courses/{id}` | ✅     | Course detail                                                |
| GET    | `/api/v1/units`        | ✅     | List units (`?courseId&page&pageSize`)                       |
| GET    | `/api/v1/lessons`      | ✅     | List lessons (`?unitId&status&primarySkillId&difficultyId`)  |
| GET    | `/api/v1/activities`   | ✅     | Activities of a lesson version (`?lessonVersionId` required) |
| GET    | `/api/v1/exercises`    | ✅     | Exercises of an activity (`?activityId` required)            |
| GET    | `/api/v1/questions`    | ✅     | Questions of an exercise (`?exerciseId`; includes choices)   |
| POST   | `/api/v1/progress`     | 🚧 501 | Record progress — payload validated; persistence is future   |

- **Soft-deleted content is excluded**; results ordered by `sort_order`.
- **Answer keys are never returned** by `GET /questions` (choices only) — grading is server-side (future).
- Planned (not yet built): `/skills`, `/learning-paths`, lesson-version publish/authoring writes.

## 6. Vocabulary — **IMPLEMENTED (Sprint 4.1)**

> Live under `/api/v1`. Learner-specific endpoints require authentication (401 otherwise).
> Deterministic SRS (SM-2 lite) — **no AI**.

| Method | Path                            | Auth | Description                                                       |
| ------ | ------------------------------- | ---- | ----------------------------------------------------------------- |
| GET    | `/api/v1/vocabularies`          | —    | List/search corpus (`?q&cefrLevelId&tag&page&pageSize`)           |
| GET    | `/api/v1/vocabularies/{id}`     | —    | Word detail (meanings, examples, pronunciations, audio, image)    |
| POST   | `/api/v1/user-vocabulary`       | user | Add a word to the learner's set (idempotent) `{ vocabularyId }`   |
| PATCH  | `/api/v1/user-vocabulary/{id}`  | user | Review (SRS) and/or favorite `{ rating?, isFavorite? }`           |
| GET    | `/api/v1/user-vocabulary/stats` | user | Progress: totalWords, studying, learned, dueToday, completionRate |
| GET    | `/api/v1/reviews/today`         | user | Due review cards for the learner                                  |

- `rating ∈ {again, hard, good, easy}` — the scheduler updates `ease`/`interval`/`dueAt` and appends `review_history`.
- Text search is `word contains q` (case-insensitive); semantic search returns with the AI epic.

## 7. Grammar / Listening / Reading

| Method | Path                                       | Description                         |
| ------ | ------------------------------------------ | ----------------------------------- |
| GET    | `/grammar/topics` · `/grammar/topics/{id}` | Topics + rules                      |
| GET    | `/grammar/topics/{id}/exercises`           | Exercises                           |
| POST   | `/grammar/exercises/{id}/attempt`          | Submit → correctness + explanation  |
| GET    | `/listening/tracks` · `/{id}`              | Tracks + transcript + questions     |
| GET    | `/reading/passages` · `/{id}`              | Passages + questions                |
| POST   | `/comprehension/questions/{id}/attempt`    | Answer a listening/reading question |

## 8. Speaking & Pronunciation

| Method | Path                           | Description                                                        |
| ------ | ------------------------------ | ------------------------------------------------------------------ |
| GET    | `/speaking/prompts`            | Prompts (filter by level/type/scenario)                            |
| POST   | `/media/upload-url`            | Get signed URL to upload recording                                 |
| POST   | `/speaking/attempts`           | Submit `{ promptId, audioAssetId }` → **202** scoring job          |
| GET    | `/speaking/attempts/{id}`      | Attempt + fluency/relevance + AI feedback                          |
| POST   | `/pronunciation/score`         | Submit `{ audioAssetId, referenceText }` → **202** phoneme scoring |
| GET    | `/pronunciation/attempts/{id}` | Word/phoneme/prosody scores                                        |

## 9. AI Conversation

| Method | Path                          | Description                                                    |
| ------ | ----------------------------- | -------------------------------------------------------------- |
| GET    | `/conversation/scenarios`     | Browse scenarios (filter by level/track)                       |
| POST   | `/conversation`               | Start conversation `{ scenarioId?, mode }`                     |
| GET    | `/conversation/{id}`          | Conversation + messages                                        |
| POST   | `/conversation/{id}/messages` | Send message (text or audioAssetId) → AI reply (stream via WS) |
| POST   | `/conversation/{id}/end`      | End → summary, corrections, XP                                 |
| GET    | `/conversation/{id}/report`   | Post-conversation feedback report                              |

**Realtime (preferred for live chat):** WebSocket namespace `/conversation` — events: `message`, `partial` (token stream), `correction`, `audio`, `typing`, `ended`.

## 10. AI Teacher

| Method | Path                | Description                                                   |
| ------ | ------------------- | ------------------------------------------------------------- |
| POST   | `/teacher/ask`      | Ask a question `{ question, context? }` → answer (streamable) |
| POST   | `/teacher/explain`  | Explain a mistake `{ targetType, targetId }`                  |
| POST   | `/teacher/review`   | Review recent errors → prioritized feedback                   |
| GET    | `/teacher/feedback` | List AI feedback history                                      |

## 11. Spaced Repetition (SRS)

| Method | Path                     | Description                                                        |
| ------ | ------------------------ | ------------------------------------------------------------------ |
| GET    | `/srs/queue`             | Due cards for now (respects daily cap)                             |
| POST   | `/srs/cards/{id}/review` | Submit `{ rating: again\|hard\|good\|easy, elapsedMs }` → next due |
| GET    | `/srs/stats`             | Retention, due counts, forecast                                    |
| POST   | `/srs/cards`             | Manually add a card `{ itemType, itemId }`                         |

## 12. Daily Plan & Adaptive Engine

| Method | Path                        | Description                                           |
| ------ | --------------------------- | ----------------------------------------------------- |
| GET    | `/plan/today`               | Today's plan (generates if absent)                    |
| POST   | `/plan/regenerate`          | Force regeneration (e.g., time budget changed)        |
| POST   | `/plan/items/{id}/complete` | Mark plan item done                                   |
| GET    | `/me/weaknesses`            | Weakness profile by skill/topic                       |
| GET    | `/me/adaptive-state`        | Estimated ability & difficulty target (debug/insight) |

## 13. Progress & Gamification

| Method | Path                                 | Description                     |
| ------ | ------------------------------------ | ------------------------------- |
| GET    | `/me/progress`                       | Skill radar, mastery %, level   |
| GET    | `/me/xp`                             | XP totals + recent transactions |
| GET    | `/me/streak`                         | Streak status                   |
| POST   | `/me/streak/freeze`                  | Use a streak freeze             |
| GET    | `/achievements` · `/me/achievements` | Catalog + unlocked              |
| GET    | `/leaderboards/{scope}`              | Leaderboard (opt-in)            |
| GET    | `/me/reports/weekly`                 | Weekly progress report          |

## 14. Exams (TOEIC / IELTS)

| Method | Path                           | Description                                        |
| ------ | ------------------------------ | -------------------------------------------------- |
| GET    | `/exams`                       | Available tests (filter by type/variant)           |
| GET    | `/exams/{id}`                  | Test structure (sections/parts)                    |
| POST   | `/exams/{id}/attempts`         | Start an attempt                                   |
| GET    | `/exams/attempts/{id}`         | Attempt state (resumable)                          |
| POST   | `/exams/attempts/{id}/answers` | Submit answers (batch per section)                 |
| POST   | `/exams/attempts/{id}/submit`  | Finish → **202** scoring (writing/speaking via AI) |
| GET    | `/exams/attempts/{id}/score`   | Scaled score / band + section feedback             |

## 15. Media

| Method | Path                | Description                                               |
| ------ | ------------------- | --------------------------------------------------------- |
| POST   | `/media/upload-url` | Request signed PUT URL `{ kind, mimeType, bytes }`        |
| POST   | `/media/confirm`    | Confirm upload `{ objectKey, checksum }` → `mediaAssetId` |
| GET    | `/media/{id}/url`   | Short-lived signed GET URL                                |

## 16. Billing

| Method | Path                           | Description                                          |
| ------ | ------------------------------ | ---------------------------------------------------- |
| GET    | `/billing/plans`               | Public plan catalog                                  |
| GET    | `/me/subscription`             | Current subscription                                 |
| POST   | `/billing/checkout`            | Create checkout session (Stripe/Apple/Google)        |
| POST   | `/billing/portal`              | Customer portal link                                 |
| POST   | `/billing/webhooks/{provider}` | Provider webhooks (signature-verified, no user auth) |

## 17. Notifications

| Method | Path                            | Description             |
| ------ | ------------------------------- | ----------------------- |
| GET    | `/me/notifications`             | List (cursor paginated) |
| POST   | `/me/notifications/read`        | Mark read `{ ids }`     |
| PATCH  | `/me/notifications/preferences` | Channels & quiet hours  |

## 18. Jobs (async handles)

| Method | Path         | Description                                                |
| ------ | ------------ | ---------------------------------------------------------- |
| GET    | `/jobs/{id}` | Status of an async job (scoring, generation, exam scoring) |

## 19. Admin / Content (RBAC: content_admin/admin)

| Method            | Path                                  | Description                         |
| ----------------- | ------------------------------------- | ----------------------------------- |
| POST/PATCH/DELETE | `/admin/courses` … `/admin/lessons` … | Content CRUD (versioned publish)    |
| POST              | `/admin/ai/generate-lesson`           | Trigger AI lesson generation → job  |
| GET               | `/admin/ai/usage`                     | AI cost/usage dashboards data       |
| GET               | `/admin/prompts` · PATCH              | Manage prompt templates (versioned) |
| GET               | `/admin/users`                        | User admin (support)                |

## 20. Cross-Cutting Concerns

- **Rate limiting:** per-user & per-IP token buckets; AI endpoints have stricter, plan-aware quotas → `429` with `Retry-After`.
- **Auth quotas:** free vs paid AI usage enforced centrally; over-limit returns `PAYMENT_REQUIRED`.
- **Validation:** all bodies validated against DTO/Zod schemas; `400` with field-level `details`.
- **Versioning:** breaking changes ship under `/api/v2`; `/v1` supported with deprecation window.
- **OpenAPI:** the spec is generated and published; the typed frontend SDK (`packages/sdk`) is generated from it — the contract is enforced, not hand-written.
- **Idempotency & retries:** safe for `POST /speaking/attempts`, `/billing/checkout`, `/lessons/{id}/complete`.
- **Observability:** every response carries `requestId`; traces link API ↔ worker ↔ AI provider.

---

_Cross-references:_ payload shapes ← [DATABASE.md](./DATABASE.md); AI job semantics → [AI_ENGINE.md](./AI_ENGINE.md); build sequence → [ROADMAP.md](./ROADMAP.md).
