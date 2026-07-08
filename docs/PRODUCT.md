# PRODUCT.md — English AI

> The single source of truth for **what** we are building and **why**.
> Engineering, design, and AI decisions must trace back to this document.

---

## 1. Vision

**Make world-class English fluency achievable for anyone, starting from zero, using a personal AI teacher that adapts to every learner.**

We believe the biggest barrier to learning English is not access to _content_ — the internet is full of it — but the absence of an affordable, patient, always-available teacher who knows exactly what _you_ struggle with and what _you_ should do next. English AI closes that gap.

## 2. Mission

- Deliver a **personalized daily learning path** for every learner, regenerated continuously from real performance data.
- Cover the **full skill spectrum** — vocabulary, listening, reading, grammar, speaking, pronunciation — plus real conversation practice with an AI partner.
- Prepare learners for **real-world outcomes**: everyday communication, work (Business English), and standardized exams (TOEIC, IELTS).
- Keep learners **motivated** through gamification, streaks, and visible progress.
- Be **affordable and accessible** on low-end devices and slow networks.

## 3. Target Users

| Segment                     | Level       | Primary Need                              | Notes                                                 |
| --------------------------- | ----------- | ----------------------------------------- | ----------------------------------------------------- |
| **Complete Beginners**      | Pre-A1 / A1 | Foundations, confidence, habit-building   | Largest segment; native-language scaffolding required |
| **Elementary–Intermediate** | A2–B1       | Structured progression, speaking practice | Core retention segment                                |
| **Upper-Intermediate**      | B2          | Fluency, nuance, fewer errors             | Bridge to exam/business tracks                        |
| **Exam Candidates**         | A2–C1       | TOEIC / IELTS score targets               | High willingness to pay                               |
| **Professionals**           | B1+         | Business English, meetings, email         | B2B potential                                         |
| **Kids (7–14)**             | Pre-A1+     | Playful, safe, parent-visible learning    | Separate UX + safety rules                            |

**Primary launch persona:** _Minh, 24, Vietnamese, A2 level, wants to speak confidently at work and eventually pass TOEIC. Studies 15–20 min/day on a mid-range Android phone._

## 4. Learning Philosophy

English AI is built on five research-backed principles. Every feature must serve at least one.

1. **Comprehensible Input (i+1):** Content is always slightly above the learner's current level — challenging but understandable.
2. **Active Recall + Spaced Repetition:** Knowledge is tested at expanding intervals (FSRS algorithm), not re-read passively.
3. **Output & Feedback Loops:** Learners _produce_ language (speaking, writing) and receive immediate, specific, corrective AI feedback.
4. **Personalization over Uniformity:** No two learners see the same daily plan. The system detects weaknesses and reallocates practice.
5. **Motivation by Design:** Small wins, streaks, and visible mastery keep the habit alive long enough for fluency to compound.

## 5. Feature List

### 5.1 Core Learning Skills

- **Vocabulary** — themed decks, word senses, collocations, images, audio, SRS-driven review.
- **Listening** — graded audio (native + AI TTS), transcripts, comprehension questions, dictation.
- **Reading** — leveled passages, inline dictionary, comprehension + inference questions.
- **Grammar** — bite-sized rules, contextual examples, targeted exercises, error explanations.
- **Speaking** — guided prompts, roleplay, fluency & relevance scoring.
- **Pronunciation** — phoneme-level scoring, minimal pairs, stress/intonation drills.

### 5.2 AI Features

- **AI Conversation** — free or scenario-based dialogue with a natural, level-adaptive partner.
- **AI Teacher** — explains, motivates, answers questions, reviews mistakes, and sets goals.
- **AI Lesson Generator** — produces lessons/exercises on demand for any topic and level.

### 5.3 Learning System

- **Daily Learning Plan** — auto-generated, time-boxed, adapts to available minutes.
- **Spaced Repetition** — unified review queue across vocab, grammar, and phrases.
- **Progress Tracking** — skill radar, mastery %, streaks, XP, weekly reports.
- **Weakness Detection & Adaptive Learning** — reallocates practice to weak areas.

### 5.4 Tracks (Specialized Curricula)

- **TOEIC** — Listening & Reading (later Speaking & Writing), full mock tests, score prediction.
- **IELTS** — Academic & General; all four sections; band-score estimation & feedback.
- **Business English** — meetings, emails, presentations, negotiation.
- **Kids English** — playful, illustrated, safe, parent dashboard.

### 5.5 Engagement & Platform

- Gamification (XP, levels, badges, quests, leaderboards).
- Notifications & reminders (streak-saver, review-due).
- Multi-language UI (learner's native language for beginners).
- Offline-friendly review (cached SRS cards).
- Subscription & payments.

## 6. User Journey

```
Discover → Onboard → Placement → First Win → Daily Habit → Mastery → Outcome → Advocacy
```

1. **Discover** — install / sign up (email, Google, Apple).
2. **Onboard** — pick native language, goal (conversation / exam / work / kids), daily time budget.
3. **Placement** — short adaptive test → estimated CEFR level + initial weakness profile.
4. **First Win** — a 5-minute lesson finished in the first session (dopamine + confidence).
5. **Daily Habit** — daily plan + reminders + streaks pull the learner back.
6. **Mastery** — skills level up; SRS keeps knowledge alive; adaptive engine targets gaps.
7. **Outcome** — measurable result (conversation confidence, TOEIC/IELTS score).
8. **Advocacy** — shareable progress, referrals.

## 7. Gamification

| Mechanic                         | Purpose                    | Rule of Thumb                                            |
| -------------------------------- | -------------------------- | -------------------------------------------------------- |
| **XP**                           | Reward every activity      | Earned per completed item; harder items = more XP        |
| **Levels**                       | Long-term progression      | XP curve; unlocks cosmetic + content                     |
| **Streaks**                      | Daily habit                | Streak freeze / repair to reduce churn on a single miss  |
| **Badges / Achievements**        | Milestone celebration      | First lesson, 7-day streak, 1000 words, exam mock passed |
| **Quests / Daily Goals**         | Direct behavior            | "Review 20 cards", "Speak for 3 minutes"                 |
| **Leaderboards**                 | Social motivation (opt-in) | Weekly leagues; off by default for Kids                  |
| **Hearts / Energy** _(optional)_ | Pacing (evaluate later)    | Must never block paying users unfairly                   |

**Design rule:** gamification amplifies learning; it must never reward gaming the system over genuine mastery.

## 8. Learning Flow (per session)

```
Open App
  → Daily Plan (today's items, time-boxed)
    → SRS Reviews due (spaced repetition first — highest ROI)
    → New Skill Lesson(s) (i+1 content)
    → Practice/Output (speaking / writing / exercises)
    → AI Feedback (immediate, specific)
  → Session Summary (XP, streak, what improved, what's weak)
  → Weakness Profile updated → tomorrow's plan regenerated
```

## 9. Future Features

- Live group classes / AI-moderated peer practice.
- Writing skill track with AI essay grading (IELTS/business).
- Real-time conversation with voice-first, low-latency AI.
- Chrome/mobile keyboard extension (learn in context of real browsing).
- Content creator marketplace (teacher-authored courses).
- Enterprise/school B2B dashboards (LMS integration).
- AR/immersive scenarios.
- Wearable micro-review (watch).

---

_Cross-references:_ feature scope → [ROADMAP.md](./ROADMAP.md); how features are built → [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md); AI capabilities → [AI_ENGINE.md](./AI_ENGINE.md).
