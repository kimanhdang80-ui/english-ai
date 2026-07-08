# UI_GUIDELINE.md — English AI

> The design system contract. Tokens live in code (`packages/ui`); this document
> defines the rules. Built on Tailwind CSS + shadcn/ui (Radix). Mobile-first.

---

## 1. Design Principles

1. **Calm & focused** — learning needs low cognitive load; one primary action per screen.
2. **Encouraging** — celebrate progress; errors are gentle and constructive.
3. **Accessible by default** — WCAG 2.2 AA minimum, for all ages and abilities.
4. **Consistent** — same component, same behavior everywhere; tokens over ad-hoc values.
5. **Fast-feeling** — instant feedback, skeletons, optimistic UI.

## 2. Color System

Defined as CSS variables / Tailwind tokens (HSL). Semantic names, never raw hex in components.

**Brand**

| Token                | Role                                        |
| -------------------- | ------------------------------------------- |
| `--brand-primary`    | Indigo 600 — primary actions, active states |
| `--brand-primary-fg` | White — text on primary                     |
| `--brand-secondary`  | Teal 500 — accents, secondary CTAs          |
| `--brand-accent`     | Amber 400 — streaks, XP, highlights         |

**Semantic / Feedback**

| Token       | Role                                 |
| ----------- | ------------------------------------ |
| `--success` | Green 500 — correct answers, mastery |
| `--warning` | Amber 500 — attention                |
| `--error`   | Red 500 — wrong answers, destructive |
| `--info`    | Blue 500 — hints, tips               |

**Neutrals** — `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--border`, `--card`, `--card-foreground`, `--input`, `--ring`.

**Skill accent colors** (for skill icons, progress rings): vocabulary=indigo, listening=sky, reading=emerald, grammar=violet, speaking=rose, pronunciation=orange.

**Rules**

- All color pairs (text/bg) meet **≥ 4.5:1** contrast (≥ 3:1 for large text/UI).
- Never encode meaning by color alone — pair with icon/label.
- Every token has a dark-mode counterpart (see §8).

## 3. Typography

- **Primary font:** Inter (variable). **Fallback:** system-ui. Learning content may use a slightly larger, higher-legibility scale.
- **Code/IPA:** a mono/phonetic-capable face for IPA rendering.

**Type scale** (rem):

| Token     | Size / Line | Use                 |
| --------- | ----------- | ------------------- |
| `display` | 2.5 / 1.1   | Hero, celebration   |
| `h1`      | 2.0 / 1.2   | Page title          |
| `h2`      | 1.5 / 1.25  | Section             |
| `h3`      | 1.25 / 1.3  | Card title          |
| `body-lg` | 1.125 / 1.6 | Reading/lesson text |
| `body`    | 1.0 / 1.6   | Default             |
| `small`   | 0.875 / 1.5 | Meta                |
| `caption` | 0.75 / 1.4  | Labels              |

**Rules:** max line length 60–75ch for reading passages; weights 400/500/600/700 only; never below 12px; support learner-adjustable text size.

## 4. Spacing & Layout

- **Base unit: 4px.** Scale: `0,1(4),2(8),3(12),4(16),6(24),8(32),12(48),16(64)`.
- **Radius:** `sm 6px · md 10px · lg 16px · full`. Cards `lg`, buttons/inputs `md`.
- **Shadows:** subtle, 3 elevations (`sm/md/lg`); avoid heavy shadows.
- **Grid:** 12-col desktop, 4-col mobile; container max-width 1200px; gutters 16/24px.
- **Touch targets:** ≥ 44×44px.
- **Density:** generous whitespace in learning flows; compact allowed only in dashboards.

## 5. Components (shadcn/ui-based)

Core library (`packages/ui`) — each is documented, tokenized, and tested:

**Primitives:** Button (primary/secondary/ghost/destructive), Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Badge, Avatar, Tooltip, Dialog/Sheet, Tabs, Accordion, Toast, Progress, Skeleton, Card, Popover, DropdownMenu.

**Domain components:**

- `LessonCard`, `SkillProgressRing`, `XPBar`, `StreakFlame`, `LevelBadge`.
- `FlashCard` (flip, audio, image), `MCQOption`, `GapFillInput`, `MatchPairs`, `DictationInput`.
- `AudioPlayer` (transcript sync), `RecordButton` (waveform + states: idle/recording/processing).
- `PronunciationResult` (word/phoneme heatmap), `SpeakingFeedbackCard`.
- `ChatBubble` (user/AI, corrections toggle), `TypingIndicator`, `SuggestedReplies`.
- `DailyPlanList`, `PlanItemRow`, `ReviewQueueCard`.
- `ScoreDial`, `WeaknessRadar`, `WeeklyReportChart`.
- `Paywall`, `PlanCard`.

**States:** every interactive component defines default / hover / focus-visible / active / disabled / loading / error. Every data view defines loading (skeleton) / empty / error / success.

## 6. Iconography

- **Library:** Lucide (line icons) — consistent 1.5–2px stroke.
- **Sizing:** 16 / 20 / 24 px; align to text baseline.
- **Usage:** decorative icons `aria-hidden`; meaningful icons have `aria-label`.
- **Skill icons** use the skill accent colors from §2.

## 7. Accessibility (WCAG 2.2 AA)

- Full **keyboard** operability; visible `focus-visible` ring (`--ring`) on all interactive elements.
- Correct **semantics/ARIA**; Radix primitives provide baseline — don't break them.
- **Screen-reader** support: labels, live regions for feedback ("Correct!", "Try again"), progress announcements.
- **Audio:** every audio has a transcript; captions for video; no audio-only critical info.
- **Motion:** respect `prefers-reduced-motion`; no essential info conveyed only via motion.
- **Forms:** label every field; inline, specific error text; never color-only errors.
- **Kids/beginners:** simple language, generous targets, optional native-language labels.

## 8. Dark Mode

- **Strategy:** `class` (`.dark`) toggle; system default with manual override; persisted per user.
- Every semantic token has a dark counterpart (adjust lightness, keep contrast ≥ AA).
- Dark surfaces layered by elevation (base → card → popover) — not pure black; reduce large saturated fills to avoid eye strain.
- Test both themes in CI visual checks.

## 9. Responsive Rules

**Breakpoints (Tailwind):** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

- **Mobile-first**: design for 360–414px first; enhance upward.
- **Navigation:** bottom tab bar on mobile; sidebar on ≥ lg.
- **Learning surfaces:** single-column, thumb-reachable primary action on mobile.
- **Dashboards:** stack → grid as width grows.
- **Images/audio:** responsive, lazy-loaded, `next/image`.
- **Safe areas:** respect device notches/insets; test landscape for listening/exam modes.

## 10. Motion & Feedback

- Durations: 150ms (micro), 250ms (standard), 400ms (celebration). Easing `ease-out` for enter, `ease-in` for exit.
- Micro-interactions on answer submit (correct/incorrect), XP gain, streak, level-up (confetti — reduced-motion aware).
- Optimistic UI for reviews/answers; reconcile on server response.

## 11. Content & Tone

- **Voice:** warm, encouraging, plain. Short sentences. Beginner-safe vocabulary.
- **Errors:** never blame ("Not quite — the answer is… here's why"). Always show the correct form + brief reason.
- **Localization:** all strings via i18n keys (`next-intl`); support learner's native language; no concatenated sentences; plural/gender-aware; RTL-ready layout.

## 12. Governance

- Tokens & components live only in `packages/ui`; apps consume them — **no one-off styles** in feature code.
- New component → documented (Storybook) + accessibility-checked + tokenized before use.
- Design changes flow token-first; visual regression tests gate merges.

---

_Cross-references:_ frontend stack → [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md); component build order → [ROADMAP.md](./ROADMAP.md); UI rules enforcement → [CLAUDE.md](./CLAUDE.md).
