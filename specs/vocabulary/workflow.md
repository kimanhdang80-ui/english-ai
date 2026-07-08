# Vocabulary Module — Workflow Spec

> End-to-end learner flows and the state transitions behind them. Complements
> [api.md](./api.md), [ui.md](./ui.md), and the SRS rules in [validation.md](./validation.md).

---

## 1. Primary happy path

```
Open app (authenticated)
        ↓
Choose "Vocabulary" (nav)
        ↓
Browse / search the A1 list        → GET /vocabularies
        ↓
Open a word (optional)             → GET /vocabularies/{id}
        ↓
"Add to learning"                  → POST /user-vocabulary  (status=new, due now)
        ↓
Go to "Today's Review" / Flashcards → GET /reviews/today
        ↓
Flip card → grade Know / Review Again → PATCH /user-vocabulary/{id} { rating }
        ↓
SRS reschedules (interval, ease, dueAt, status) + ReviewHistory appended
        ↓
Progress updates                   → GET /user-vocabulary/stats
        ↓
Repeat daily; due queue drives retention
```

## 2. Sub-flows

### 2.1 Add a word

```
List/Detail → AddToLearningButton
  → POST /user-vocabulary { vocabularyId }
     ├─ new  → create UserVocabulary (new, due=now) → 201 state → button "Added ✓"
     └─ exists → return existing state (idempotent) → button "Added ✓"
```

### 2.2 Review a card (SRS)

```
Flashcard/Review shows card (front) → "Show answer" (back)
  → grade:
     ├─ "Know"        → PATCH { rating:"good" }
     └─ "Review Again"→ PATCH { rating:"again" }
  → server: schedule(state, rating, now):
       again → reps=0, lapses+1, interval=0 (due now), ease−0.2 (≥1.3), status=learning
       good  → reps+1, interval=1→3→round(interval*ease), status by interval
     persist UserVocabulary + append ReviewHistory (one transaction)
  → advance to next card; at end → session summary
```

### 2.3 Favorite / unfavorite

```
Flashcard heart toggle
  → optimistic UI flip
  → PATCH /user-vocabulary/{id} { isFavorite }
     └─ on failure → revert optimistic state
```

### 2.4 Quiz

```
Open Quiz → GET corpus items (server) → generateQuiz(items) [pure]
  → client renders questions (MC / fill-blank / match / true-false)
  → learner answers → client grades against generated key → Score
  → Finish → summary  (NOTE: quiz does NOT write progress in this module version)
```

### 2.5 Progress

```
Open Progress → GET /user-vocabulary/stats
  → render Total / Studying / Learned / Due today + completion bar
```

## 3. Learner-state machine (per word)

```
        add
 (none) ────► new ──review(any)──► learning ──review(good, interval≥7)──► known
                         ▲                                   │
                         │ review(again)                     │ review(good, interval≥30)
                         └───────────────────────────────────┴────► mastered
```

- **new**: added, never reviewed (due immediately).
- **learning**: reviewed at least once, interval < 7 days.
- **known**: interval ≥ 7 days.
- **mastered**: interval ≥ 30 days (drops out of the "today" queue).
- A lapse (`again`) resets interval to 0 and returns the word to **learning** / due now.

## 4. Review-queue selection

```
"today" = { UserVocabulary : user_id = me ∧ due_at ≤ now ∧ status ≠ mastered }
         ordered by due_at asc, capped (default 50)
```

## 5. Authentication gates

- Catalog browse/detail: available without special permission (still inside the app shell).
- Add / review / favorite / today / stats: **require an authenticated learner**;
  unauthenticated API calls → 401; unauthenticated page visits → redirect to `/login`
  (Edge middleware) with `redirectTo`.

## 6. Failure & recovery

| Failure                     | Behavior                                                                |
| --------------------------- | ----------------------------------------------------------------------- |
| Network error on add        | Button shows "Retry"; no partial state persisted                        |
| Grade PATCH fails           | Card stays; user can grade again; no double-write                       |
| Word not found (detail)     | `not-found` page                                                        |
| Session empty (nothing due) | Empty-state prompts adding more words                                   |
| Auth expired mid-session    | Next protected action redirects to login; session resumes after re-auth |

## 7. Non-goals in the flow

- No AI recommendation of "next word".
- No streaks/XP writes (platform gamification is a later epic).
- Quiz results are **not** persisted to SRS (self-test only) in this module version.
