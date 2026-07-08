# ROADMAP.md — English AI

> Development split into ~40 sprints (2 weeks each). Each sprint lists **Goal**,
> **Deliverables**, and **Dependencies**. Sequencing prioritizes a solid
> foundation before features, and a shippable core (MVP) before specialized tracks.

**Phases:** P0 Foundation (1–6) · P1 Core Learning MVP (7–16) · P2 AI & Adaptive (17–24) · P3 Engagement & Monetization (25–30) · P4 Exams & Tracks (31–38) · P5 Scale & Mobile (39–40+).

---

## Phase 0 — Foundation (Sprints 1–6)

### Sprint 1 — Repo, Tooling & CI/CD

- **Goal:** Monorepo skeleton with quality gates before any feature code.
- **Deliverables:** monorepo (`apps/`, `packages/`), TypeScript strict, ESLint/Prettier, commit hooks, GitHub Actions (lint/type/test/build), Docker base images, env/secrets convention, `PROJECT_STATE`/`CHANGELOG` wired.
- **Dependencies:** none (see [NEXT_TASK.md](./NEXT_TASK.md)).

### Sprint 2 — Database & Domain Foundations

- **Goal:** Postgres + Prisma schema for identity & content core.
- **Deliverables:** Postgres+pgvector via Docker, Prisma schema (users, profiles, auth, roles, languages, cefr_levels, skills, courses/units/lessons), migration pipeline, seed script, repository pattern.
- **Dependencies:** S1.

### Sprint 3 — Auth & Identity

- **Goal:** Secure authentication end-to-end.
- **Deliverables:** register/login/refresh/logout, email verification, password reset, OAuth (Google), argon2id, refresh rotation + reuse detection, RBAC guards, rate limiting.
- **Dependencies:** S2.

### Sprint 4 — Design System Foundation

- **Goal:** `packages/ui` with tokens + core primitives.
- **Deliverables:** Tailwind preset, color/type/spacing tokens, dark mode, Button/Input/Card/Dialog/Tabs/Toast/Progress/Skeleton, Storybook, a11y baseline.
- **Dependencies:** S1.

### Sprint 5 — App Shell & Frontend Foundation

- **Goal:** Next.js app that authenticates and navigates.
- **Deliverables:** Next.js App Router shell, auth flow UI, protected routes, TanStack Query + generated SDK, i18n scaffold, responsive nav (bottom tabs/sidebar), profile page.
- **Dependencies:** S3, S4.

### Sprint 6 — Observability, Media & AI Ports

- **Goal:** Cross-cutting infra ready before features scale.
- **Deliverables:** structured logging + OpenTelemetry + Sentry, health/readiness, BullMQ + Redis worker skeleton, media upload (signed URLs) + `media_assets`, **AI port interfaces** (`LlmPort`/`SpeechPort`/`TtsPort`/`ScoringPort`) with a Claude adapter stub + `ai_usage_logs`.
- **Dependencies:** S2, S3.

---

## Phase 1 — Core Learning MVP (Sprints 7–16)

### Sprint 7 — Content Model & Admin (read/seed)

- **Goal:** Serve real curriculum content.
- **Deliverables:** content APIs (courses/units/lessons/activities), content versioning/publish, seed A1–A2 curriculum, minimal content-admin CRUD.
- **Dependencies:** S2, S5.

### Sprint 8 — Lesson Player

- **Goal:** Learners complete a lesson.
- **Deliverables:** lesson player UI (activity sequencing), activity components (intro/MCQ/gap-fill/match), start/complete APIs, XP award on completion.
- **Dependencies:** S7.

### Sprint 9 — Vocabulary Module

- **Goal:** Learn and save words.
- **Deliverables:** vocab tables + APIs (decks/words/senses/examples), FlashCard component (audio/image/flip), save-word → creates SRS card, vocab search (text).
- **Dependencies:** S8.

### Sprint 10 — Spaced Repetition Engine (SRS)

- **Goal:** Reviews that actually schedule.
- **Deliverables:** `srs_cards`/`srs_reviews`, **FSRS** scheduler (deterministic, unit-tested), `/srs/queue` + review API, review UI, daily cap, retention stats.
- **Dependencies:** S9.

### Sprint 11 — Grammar Module

- **Goal:** Grammar learning + practice.
- **Deliverables:** grammar tables + APIs, rule presentation UI, exercise types (mcq/fill/transform/error-correct), attempt scoring + explanations, grammar items feed SRS.
- **Dependencies:** S8, S10.

### Sprint 12 — Reading Module

- **Goal:** Leveled reading with comprehension.
- **Deliverables:** passages + comprehension questions/options, reading UI + inline dictionary (links to vocab), attempt tracking.
- **Dependencies:** S8, S9.

### Sprint 13 — Listening Module

- **Goal:** Audio comprehension + dictation.
- **Deliverables:** listening tracks + audio pipeline, AudioPlayer with transcript sync, comprehension + dictation activities, attempt tracking.
- **Dependencies:** S6 (media), S12.

### Sprint 14 — Progress & Basic Gamification

- **Goal:** Visible progress + habit hooks.
- **Deliverables:** `skill_progress`/`xp_transactions`/`streaks`, progress dashboard (skill radar, XP, level), streak logic + freeze, XP animations.
- **Dependencies:** S8–S13.

### Sprint 15 — Daily Plan (deterministic v1)

- **Goal:** A generated plan each day.
- **Deliverables:** Learning Engine planner (due reviews + next content, time-boxed), `/plan/today` + regenerate + item-complete, DailyPlanList UI.
- **Dependencies:** S10, S14.

### Sprint 16 — MVP Hardening & Beta

- **Goal:** Ship a usable closed beta.
- **Deliverables:** E2E tests of core flows, empty/error/loading states, perf pass, staging deploy, onboarding v1, analytics events, bug triage.
- **Dependencies:** S7–S15.

---

## Phase 2 — AI & Adaptive (Sprints 17–24)

### Sprint 17 — AI Orchestrator & Claude Integration

- **Goal:** Production AI plumbing.
- **Deliverables:** real Claude adapter (Opus/Sonnet/Haiku tiers), prompt templates (versioned in DB), structured-output validation, retry/escalate, prompt caching, usage logging + cost dashboard, per-plan quotas.
- **Dependencies:** S6.

### Sprint 18 — AI Conversation (text)

- **Goal:** Chat with an AI partner.
- **Deliverables:** scenarios, conversation + messages APIs, WebSocket streaming, ChatBubble UI + suggested replies, silent grammar corrections, end-of-chat summary.
- **Dependencies:** S17.

### Sprint 19 — AI Teacher & Grammar Correction

- **Goal:** Explain/review/motivate + correction service.
- **Deliverables:** teacher ask/explain/review APIs, grammar-correction service (structured errors), `ai_feedback` persistence, "explain my mistake" in lesson/review UI.
- **Dependencies:** S17, S11.

### Sprint 20 — Speech-to-Text & Speaking

- **Goal:** Speaking practice with feedback.
- **Deliverables:** STT adapter, RecordButton + waveform, speaking prompts + attempts (async scoring job), fluency/relevance + AI feedback, voice input in conversation.
- **Dependencies:** S6, S18.

### Sprint 21 — Pronunciation Scoring

- **Goal:** Phoneme-level assessment.
- **Deliverables:** Azure Speech Assessment adapter, pronunciation/phoneme scores, PronunciationResult heatmap UI, minimal-pair drills, AI-authored improvement tips.
- **Dependencies:** S20.

### Sprint 22 — Text-to-Speech Pipeline

- **Goal:** Natural generated audio at scale.
- **Deliverables:** TTS adapter (ElevenLabs/Azure), async render + dedup by content hash, voice output in conversation/teacher, TTS for generated content.
- **Dependencies:** S17, S6.

### Sprint 23 — Weakness Detection & Adaptive Engine

- **Goal:** Personalization from real data.
- **Deliverables:** `weakness_signals`/`weakness_profiles`, AI clustering of error patterns, `adaptive_states` (ability estimate) + difficulty targeting, adaptive sequencing in lessons/SRS, `/me/weaknesses`.
- **Dependencies:** S19, S10, S14.

### Sprint 24 — AI Lesson Generator + Adaptive Daily Plan

- **Goal:** On-demand content + smarter plans.
- **Deliverables:** lesson generator (schema-validated, async, review gate), weakness-targeted generation, AI re-ranking/theming of daily plan + motivating summary, placement test (adaptive).
- **Dependencies:** S17, S23, S15.

---

## Phase 3 — Engagement & Monetization (Sprints 25–30)

### Sprint 25 — Achievements & Quests

- **Goal:** Deeper motivation.
- **Deliverables:** achievements/user_achievements, quests/daily goals, unlock UI + celebrations, criteria engine.
- **Dependencies:** S14.

### Sprint 26 — Leaderboards & Social (opt-in)

- **Goal:** Social motivation.
- **Deliverables:** weekly leaderboards (Redis), leagues, opt-in privacy, friends (basic), Kids excluded.
- **Dependencies:** S25.

### Sprint 27 — Notifications & Reminders

- **Goal:** Bring learners back.
- **Deliverables:** devices/push tokens, notification types (reminder/streak/review-due/achievement), scheduling worker, preferences + quiet hours, web push + FCM/APNs.
- **Dependencies:** S6, S14.

### Sprint 28 — Billing & Subscriptions

- **Goal:** Monetize.
- **Deliverables:** plans/subscriptions/payments, Stripe checkout + webhooks, paywall + plan cards, AI-quota enforcement by plan, trials.
- **Dependencies:** S17 (quotas), S5.

### Sprint 29 — Weekly Reports & Insights

- **Goal:** Show measurable progress.
- **Deliverables:** weekly report generation (AI summary + charts), WeeklyReportChart/WeaknessRadar, email/report delivery.
- **Dependencies:** S23, S14.

### Sprint 30 — Onboarding & Retention Polish

- **Goal:** Convert & retain.
- **Deliverables:** refined onboarding (goal → placement → first win), streak-saver flows, re-engagement, A/B experiment framework.
- **Dependencies:** S24, S27, S28.

---

## Phase 4 — Exams & Specialized Tracks (Sprints 31–38)

### Sprint 31 — Exam Framework

- **Goal:** Reusable exam engine.
- **Deliverables:** exam tables (tests/sections/questions/options/attempts/answers/scores), timed attempt engine (resumable), exam player UI, scoring pipeline.
- **Dependencies:** S12, S13.

### Sprint 32 — TOEIC Listening & Reading

- **Goal:** TOEIC L&R mocks.
- **Deliverables:** TOEIC content + 7 parts, scaled score estimation, TOEIC dashboard, targeted drills.
- **Dependencies:** S31.

### Sprint 33 — TOEIC Score Prediction & Drills

- **Goal:** Guided TOEIC prep.
- **Deliverables:** score prediction from history, weakness-driven TOEIC drills, study plan integration.
- **Dependencies:** S32, S23.

### Sprint 34 — IELTS Listening & Reading

- **Goal:** IELTS L&R (Academic/General).
- **Deliverables:** IELTS content + question types, band estimation, IELTS dashboard.
- **Dependencies:** S31.

### Sprint 35 — IELTS Writing (AI grading)

- **Goal:** AI-graded writing.
- **Deliverables:** writing prompts/submissions, AI band-scored feedback (task/coherence/lexical/grammar), model answers, revision loop.
- **Dependencies:** S19, S34.

### Sprint 36 — IELTS Speaking (AI examiner)

- **Goal:** AI speaking test.
- **Deliverables:** 3-part speaking simulation, AI examiner (voice), fluency/pronunciation/lexical/grammar band feedback.
- **Dependencies:** S20, S21, S35.

### Sprint 37 — Business English Track

- **Goal:** Workplace English.
- **Deliverables:** business courses/scenarios (meetings/email/presentations/negotiation), roleplay scenarios, business vocab decks, email-writing feedback.
- **Dependencies:** S18, S24.

### Sprint 38 — Kids English Track

- **Goal:** Safe, playful kids experience.
- **Deliverables:** kids theme/UX, safety guardrails (restricted AI, no social/leaderboards), parent dashboard + controls, playful gamification, illustrated content.
- **Dependencies:** S24, safety review.

---

## Phase 5 — Scale & Mobile (Sprints 39–40+)

### Sprint 39 — Performance, Scale & Reliability

- **Goal:** Scale-ready.
- **Deliverables:** read replicas, partitioning of hot tables, cache tuning, load testing + autoscaling (HPA), SLOs/alerting, cost optimization pass, DR/backup drills.
- **Dependencies:** phases 1–4.

### Sprint 40 — Mobile App (Expo) Foundation

- **Goal:** Native iOS/Android.
- **Deliverables:** Expo app sharing SDK + tokens, auth + core learning + SRS + conversation, offline review cache, push notifications, store builds.
- **Dependencies:** S5, S27, stable API.

### Beyond 40 (Backlog)

Writing skill (general), voice-first low-latency conversation, teacher marketplace, B2B/schools, more languages, AR scenarios, wearable micro-review, live/peer practice. See [PRODUCT.md](./PRODUCT.md) §9.

---

## Milestones

- **M1 — Core MVP (end S16):** learn vocab/grammar/reading/listening + SRS + daily plan + progress.
- **M2 — AI Platform (end S24):** conversation, teacher, speaking, pronunciation, adaptive, generation.
- **M3 — Monetized Product (end S30):** engagement + billing + reports.
- **M4 — Exams & Tracks (end S38):** TOEIC, IELTS, Business, Kids.
- **M5 — Scale & Mobile (S39–40):** production-hardened + native app.

_Cross-references:_ Sprint 1 detail → [NEXT_TASK.md](./NEXT_TASK.md); rules → [CLAUDE.md](./CLAUDE.md); status → [PROJECT_STATE.md](./PROJECT_STATE.md).
