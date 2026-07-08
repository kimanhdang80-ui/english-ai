# Vocabulary Module — UI Spec

> Screen-by-screen specification. All screens live under the authenticated dashboard
> shell (header nav + logout) and must be **responsive** (mobile-first, 360px up).
> Follows [UI_GUIDELINE.md](../../docs/UI_GUIDELINE.md): semantic tokens, dark mode,
> WCAG 2.2 AA, ≥44px touch targets. Every data view defines loading / empty / error /
> success states.

**Shared conventions**

- Container max-width ~`4xl`; content padded; cards use `rounded-lg border bg-card`.
- Interactive elements have visible `focus-visible` rings and `aria-label`s.
- Data-fetching screens are server-rendered; interactions (add, grade, quiz) are client components.

---

## 1. Vocabulary List — `/vocabulary`

**Purpose:** browse/search the corpus and add words.

**Layout**

- Header row: title "Vocabulary" + count subtitle; action buttons (Today's Review, Flashcards, Quiz).
- Search form (GET): text input `q` + Search button.
- Responsive grid of word cards (1 col mobile, 2 cols ≥ sm).
- Pagination footer (Previous / "Page X / N" / Next) when > 1 page.

**Components**

- `VocabularyListItem` (presentational): word (link to detail), IPA, `POS · definition`, `AddToLearningButton`.
- `AddToLearningButton` (client): calls `POST /api/v1/user-vocabulary`; states idle → loading → "Added ✓" (disabled) / "Retry" on error.

**States**

- **Loading:** skeleton cards (grid of placeholders).
- **Empty (no results):** "No words found." message; keep the search box.
- **Error:** inline error card with retry (reload/search again).
- **Success:** grid populated; add buttons reflect per-word add state.

---

## 2. Vocabulary Detail — `/vocabulary/{id}`

**Purpose:** full information for a single word.

**Layout**

- Back link "← Vocabulary".
- Header: word (large) + IPA; `AddToLearningButton` on the right.
- Image block (or "No image yet" dashed placeholder).
- **Meanings** card: list of `POS`, definition, translation.
- **Examples** card (if any): italic example sentences.
- Tag chips (if any).

**Components**

- Reuses `Card`, `AddToLearningButton`; audio play control if an audio URL exists.

**States**

- **Loading:** header + card skeletons.
- **Empty:** N/A for the word itself; sub-sections hidden when empty (no examples → no card; no image → placeholder).
- **Error / not found:** 404 → Next `not-found` page ("Word not found"). Other errors → error boundary.
- **Success:** all available sections rendered.

---

## 3. Flashcard — `/vocabulary/flashcards`

**Purpose:** study the learner's set with flip-and-grade.

**Layout**

- Title + subtitle.
- Progress line: "Card i / N" + Favorite toggle (heart).
- Card face:
  - **Front:** word (large), audio button (if any), IPA, part of speech.
  - **Back (revealed):** image or placeholder, definition + translation, example.
- Controls: **Show answer** (front) → then **Review again** (outline) / **Know** (primary).

**Components**

- `FlashcardSession` (client): manages index, revealed, favorites, busy; on grade calls
  `PATCH /api/v1/user-vocabulary/{id}` with `{ rating: good|again }`, advances; favorite
  calls `PATCH … { isFavorite }` (optimistic).

**States**

- **Loading:** the parent server component fetches the set; card area may show a skeleton.
- **Empty (no cards):** message + "Add more words" → `/vocabulary`.
- **Error (grade fails):** keep the card in place; allow retry (button re-enabled).
- **Complete:** summary card "Session complete — reviewed N · knew K" + links (Progress, Words).

---

## 4. Quiz — `/vocabulary/quiz`

**Purpose:** self-test across four question types (generated deterministically, no AI).

**Layout**

- Title + subtitle.
- Progress line: "Question i / N" + running Score.
- Question card by type:
  - **Multiple Choice:** prompt + option buttons; on select show correct/incorrect coloring.
  - **Fill in the Blank:** sentence with `_____`, text input + Check; reveal answer.
  - **Match Word:** rows of word → `<select>` of meanings; Check; per-row ✓/✕.
  - **True / False:** statement + True/False buttons.
- **Next / Finish** button appears after answering.

**Components**

- `QuizSession` (client) with sub-renderers `MultipleChoice`, `FillBlank`, `TrueFalse`, `MatchWord`.

**States**

- **Loading:** server builds questions from corpus; brief skeleton acceptable.
- **Empty (too few words, < 4):** "Not enough words to build a quiz yet." + link to browse.
- **Error:** error card; allow reload.
- **Complete:** "Quiz complete — Score X / N" + back link.

---

## 5. Today's Review — `/review`

**Purpose:** review exactly the words due now (SRS queue).

**Layout**

- Title + subtitle ("N cards due — spaced repetition keeps them fresh").
- Reuses the **FlashcardSession** over `GET /reviews/today` cards.

**States**

- **Loading:** skeleton.
- **Empty (nothing due):** FlashcardSession's empty state ("No cards to review right now" + add words).
- **Error:** error card.
- **Complete:** session-complete summary (as Flashcard).

---

## 6. Progress — `/progress`

**Purpose:** show vocabulary progress.

**Layout**

- Title + subtitle.
- Stat grid (2 cols mobile → 4 cols lg): **Total words**, **Studying**, **Learned**, **Due today**.
- **Completion** card: "X learned · Y%" + a progress bar (`role="progressbar"` with aria values).
- Actions: "Review due words" → `/review`; "Add more words" → `/vocabulary`.

**Components**

- `Card`, progress bar; data from `GET /user-vocabulary/stats`.

**States**

- **Loading:** stat-card skeletons.
- **Empty (new learner):** zeros shown; completion 0%; CTA to add words.
- **Error:** error card.
- **Success:** real numbers + bar width = completion %.

---

## 7. Navigation & responsiveness

- Dashboard nav includes **Vocabulary**, **Review**, **Progress** (bottom-reachable on mobile).
- Grids collapse to single column on small screens; primary actions are thumb-reachable.
- Flashcard/Quiz cards are centered, max-width `xl`, comfortable tap targets.

## 8. Accessibility

- Heart/audio/answer controls have `aria-label` / `aria-pressed` where stateful.
- Progress bars expose `aria-valuenow/min/max`.
- Correct/incorrect never conveyed by color alone (icons/text accompany).
- Respect `prefers-reduced-motion` for any flip/celebration animation.
