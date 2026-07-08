# MISSION_QUALITY_REPORT.md — QA-01 Mission Quality Audit

> Reviewers: Senior English Teacher · CEFR Curriculum Designer · TESOL Expert · UX Researcher.
> Scope: **read-only** pedagogical audit of the entire Mission Library — 4 tracks × 10 missions
> = **40 missions** (`content/tracks/*.json`, `content/missions/**`). Target learner: Vietnamese
> adult **A0–A1** beginners, 15–20 min/day. **No code was written or changed.** Date: 2026-07-02.

---

## 0. Executive summary

**The content is good; the difficulty architecture is not.** Across all 40 missions the
dialogues are natural and realistic, the answer keys are almost entirely correct, the Vietnamese
glosses are accurate, and the vocabulary is—with a handful of exceptions—genuinely A0–A1. The
authoring craft is high.

The **systemic weakness is difficulty progression**. The `difficulty` field (easy→medium→hard)
and the mission order (1→10) do **not** track the real linguistic load a beginner experiences.
The curve is essentially **flat**, and in Business and Travel it **inverts at the end** — the
easiest lessons (small talk, greetings) are labeled **"hard"** and placed **last**. Every track
also **omits the same foundational block — numbers, time, and days** — which later missions
silently depend on (prices, "seven o'clock", "platform two", "100 cm = 1 m").

**Verdict:** ship-worthy content, **not** yet a ship-worthy curriculum. Fix the calibration
(labels, sequence) and the shared foundation gap, plus ~10 concrete per-mission errors, and this
becomes a well-graded A0→A1 program.

### Scorecard (reviewer consensus, /10)

| Dimension                   | General | Business | Construction | Travel  | Library |
| --------------------------- | :-----: | :------: | :----------: | :-----: | :-----: |
| 1. Vocabulary is A0–A1      |   9.0   |   6.5    |     7.0      |   8.5   | **7.8** |
| 2. Dialogue is natural      |   9.0   |   8.5    |     8.5      |   9.0   | **8.8** |
| 3. Difficulty rises 1→10    |   3.0   |   4.0    |     5.0      |   3.0   | **3.8** |
| 4. Quiz tests the objective |   7.5   |   7.5    |     7.5      |   8.0   | **7.6** |
| 5. Completion is reasonable |   7.0   |   7.0    |     7.0      |   7.0   | **7.0** |
| **Overall**                 | **7.1** | **6.7**  |   **7.0**    | **7.1** | **6.9** |

---

## 1. Vocabulary — is it genuinely A0–A1?

**Mostly yes.** ~80 unique words per track (8 × 10), with **no exact vocab-item duplicated**
inside a track — good hygiene. General and Travel sit cleanly at A0–A1. The specialized tracks
carry harder words, some justified (trade/office survival vocab) and some genuinely above A1.

**Above-A1 words to reconsider (by frequency/syllable load):**

| Track        | B1 / too-hard for A0–A1                                                                                              | A2 but justified (on-topic)                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Business     | `agenda`, `postpone` (05); `responsible` (06); `invoice` (07); `presentation`, `audience` (10)                       | `department`, `engineer`, `schedule`, `deadline`, `discount`, `amount`, `total` |
| Construction | `excavator`, `bulldozer`, `forklift` (07); `electrician`, `supervisor` (04); `deadline`, `overtime`, `schedule` (09) | `harness` (03), `replace` (08), `handover` (10) — essential trade vocab         |
| Travel       | — (none truly exceed A1)                                                                                             | `departure`, `security`, `reservation`, `souvenir`, `exchange`, `pharmacy`      |
| General      | — (none exceed A1)                                                                                                   | `expensive` (07) is the single longest word                                     |

**Meaning/IPA accuracy nits:** `travel-10` `hello` IPA is **/heˈloʊ/** → should be **/həˈloʊ/**
(the one outright IPA error). `travel-09` glosses `view` as "cảnh đẹp" (implies _beautiful_) →
"quang cảnh / tầm nhìn". `construction-02` `wire` = "dây điện" is too narrow. `business-07`
`amount` = "số lượng, số tiền" conflates quantity and money. **BrE/AmE IPA is inconsistent**
across the library (`schedule /ˈʃed.juːl/` vs `/ˈskedʒ.uːl/`, `favor` vs UK IPA) — pick one
variety (BrE recommended for the VN market) and apply it uniformly.

## 2. Dialogue — is it natural?

**Strong across the board.** Dialogues read like real check-ins, phone calls, site talk, and
restaurant scenes; registers are appropriate; most are coherent A/B exchanges. This is the
library's best dimension. A few defects to fix:

- **`construction-03` — grammar error:** _"This area is danger."_ → must be **"This area is
  dangerous."** (`danger` is a noun). MC #5 leans on it. **This is the most important content
  error in the library** — it teaches a wrong form to beginners.
- **`business-01/02` — non-standard "staff":** "I am the new staff" / "We have ten staff" (incl.
  a fill-blank answer). Native English needs "staff **member(s)**".
- **`business-04` — grammar ahead of level:** the dialogue is entirely **past simple**
  (sent/did/replied) though no past tense is taught and the whole track is present-tense A1.
- **`travel-07` — realism:** "Do you want cash or a card?" at a money-**exchange** counter fits a
  _payment_ scene, not exchanging money.
- **`business-10` — structure:** near-monologue (A speaks 7 lines, B only 3).

## 3. Difficulty — does it rise 1→10? ⚠️ the core problem

**No.** In every track the real load is **flat or non-monotonic**, and the labels are internally
inconsistent. Evidence:

- **Flat signals:** identical structure every mission (8 vocab / 8–10 dialogue lines / 5 MC + 3
  fill + 2 matching / 0.8 pass); `estimatedMinutes` barely moves (12→15, Travel only 12→14); no
  new grammar is introduced late (no past/future, conditionals, or comparatives beyond one
  opposite pair).
- **General:** "hard" 09–10 (directions: _"Turn right"_; hobbies: _run/swim/read_) are **easier**
  than "medium" 06 (present-simple routines). All 10 are plain A1.
- **Business:** load rises 01→07 (peak: `invoice`/`agenda`/`responsible`) then **drops** —
  **08 "medium"** (please/help/sorry) and **09 "hard"** (weekend/coffee/tired — the _easiest_
  words in the track) are mis-graded. Curve rises then collapses before 10.
- **Construction:** non-monotonic — **04 "easy"** is really medium (electrician/supervisor),
  **06 "medium"** is the easiest verbs (lift/push/pull), **07 "medium"** is the hardest jargon
  (excavator/bulldozer). True order ≈ 06 < 01 < 02 < 03 ≈ 10 < 05 ≈ 08 < 09 < 04 ≈ 07.
- **Travel:** curve **inverts** — vocab rarity peaks mid-track (souvenir/exchange/pharmacy) and is
  **lowest at the end**; **travel-10 "hard"** is A0 greetings (hello/friend/happy), the easiest
  mission, placed last.

**Root cause:** the `difficulty` field appears to track _pragmatic/social_ difficulty (small talk,
presenting, handover feel "advanced") rather than the _linguistic_ difficulty an A1 learner
actually meets. Those are different axes; the label should reflect language load.

## 4. Quiz — does it test the objective?

**Generally yes, with one recurring structural gap.** Most MC/fill/matching items are on-target
with correct keys and clean distractors. Issues:

- **Under-testing (library-wide pattern):** 1–2 of the 8 taught words per mission appear **only in
  matching**, never in MC or fill — e.g. `construction-04` supervisor/worker, `construction-07`
  bulldozer/forklift, `business-07` order/amount, `business-10` start/thank, `travel-05` order,
  `travel-08` police/pain, `travel-09` beach/castle. The two **hardest** words are often the ones
  left matching-only — the opposite of what recall practice needs.
- **Redundant items:** `construction-10` MC#1 (`done`) and MC#5 (`complete`) test the same concept
  ("finished"); `construction-02` MC#1/fill#1 both test cement+sand→mortar.
- **Off / trivial items:** `general-01` MC#1 "greet someone **in the morning**?" → keyed "Hello"
  (morning greeting is "Good morning"); `general-03` MC#1 "what comes after one" is trivial;
  `general-04` MC#1 uses non-mission distractors (read/sleep). Distractors are often _absurdly_
  off-topic (car/coffee/chair) so MC discrimination is near zero — acceptable at A0, but later
  missions deserve plausible in-domain distractors.
- **Untaught words in prompts:** `construction-02` prompts use "mortar" (never taught).

## 5. Completion — is it reasonable?

**Reasonable but one-size-fits-all.** Every mission uses `min_quiz_score ≥ 0.8`. 80% is a sound
mastery bar for A1 recall, and consistency is good. Two refinements: (a) it is uniform regardless
of whether a mission is genuinely easy or hard, so it doesn't reinforce the (intended)
progression; (b) since the quiz only covers ~6 of 8 taught words (see §4), "80% of the quiz" ≠
"80% of the vocabulary". Fixing §4's coverage makes the 0.8 bar mean what it says.

---

## 6. Per-track one-line verdicts

- **General (7.1)** — cleanest A1 vocab; strongest missions 07 (Shopping) & 09 (Directions);
  weakest 03 (Numbers under-delivers: only teaches one/two/ten). Difficulty flat.
- **Business (6.7)** — best dialogues (03 Telephone, 08 Requests); several B1 words; **worst
  calibration** (09 easiest words labeled "hard"). Title 07 "Numbers" teaches finance nouns, not
  numbers.
- **Construction (7.0)** — coherent trade syllabus; strongest 06 & 08; heaviest jargon (04, 07);
  carries the one grammar error (03 "is danger"). Missing emergency/first-aid language.
- **Travel (7.1)** — most consistent quality; strongest 01 & 06; curve **inverts** (10 easiest &
  last); the one IPA error (hello).

---

## 7. Recommendations — the four lists (consolidated across all 40)

### 🔧 CẦN SỬA — Mission nào cần sửa (fix these)

**Content errors (highest priority):**

- `construction-03` — dialogue "This area is danger." → **"…is dangerous."** (+ MC#5).
- `travel-10` — `hello` IPA `/heˈloʊ/` → **`/həˈloʊ/`**.
- `business-01/02` — "staff" used as countable → "staff **member(s)**" (incl. 02 fill answer).
- `general-01` — MC#1 drop "in the morning" (answer "Hello" doesn't fit a morning greeting).
- `travel-09` — `view` gloss "cảnh đẹp" → "quang cảnh / tầm nhìn".
- `construction-02` — remove untaught "mortar" from prompts; broaden `wire` gloss.
- `business-07` — split `amount` (quantity vs money) senses.
- `business-04` — align dialogue to present tense (or introduce past tense deliberately).

**Structural fixes:**

- **Quiz coverage** — ensure every taught word appears in at least one MC or fill (fix the
  matching-only words in construction-04/07, business-07/10, travel-05/08/09, etc.).
- **Redundant quiz items** — `construction-10` MC#1 vs MC#5; `construction-02` MC#1/fill#1.
- **IPA standard** — choose BrE (or AmE) and apply library-wide.
- **Difficulty labels** — re-grade to match real language load (see next two lists).

### 🔺 QUÁ KHÓ — Mission nào quá khó (too hard for A0–A1)

_No mission is beyond reach, but these carry above-A1 vocabulary that needs stronger L1 support
or simpler alternatives:_

- `business-05` — `agenda`, `postpone` (B1) → prefer "change the time / put off".
- `business-06` — `responsible (for)` (B1, 4 syllables).
- `business-07` — `invoice` (B1) + dense finance nouns; hardest "medium".
- `business-10` — `presentation`, `audience` (B1) — acceptable as the capstone, watch load.
- `construction-07` — `excavator`, `bulldozer`, `forklift` (labeled only "medium"; heaviest jargon).
- `construction-04` — `electrician`, `supervisor` (labeled "easy"; really medium).

### 🔻 QUÁ DỄ — Mission nào quá dễ (too easy for their slot / mislabeled)

- `business-09` (order 9, "hard") — weekend/coffee/tired: **easiest vocab in the track** labeled hard.
- `travel-10` (order 10, "hard") — A0 greetings: **easiest mission**, mislabeled and mis-sequenced.
- `business-08` (order 8, "medium") — please/help/sorry: A1-basic, easier than 05–07.
- `general-09` & `general-10` (both "hard") — simple imperatives / A0 activity verbs.
- `construction-06` ("medium") — lift/push/pull: easiest verbs in the track.
- `general-03` — quiz too trivial (and under-delivers its own "counting" goal).

### ➕ THIẾU — Mission nào thiếu (missing content / slots that should exist)

**Library-wide (highest priority):**

- **Numbers · Time · Days of the week** — used everywhere (prices, "seven o'clock", "platform
  two", "100 cm = 1 m") but **never taught** in any track. This is the single biggest gap; it
  should be a foundational mission (or a shared pre-track) that other missions build on.

**Per track:**

- **General** — numbers 3–9/11–100, colors, days/months, jobs, clothes, body/health, transport set;
  core verbs (have/go/like/want) are used but never taught.
- **Business** — a real numbers/time mission; in-meeting language (agree/disagree/opinions);
  leave-taking/goodbyes (track opens with hello, never closes); office locations/directions;
  handling delays; reconcile near-synonyms (subject vs topic, cost vs price).
- **Construction** — **emergency / first-aid** (fire, injury, "call for help", accident) — a serious
  omission for a worker track; numbers & time; site directions; material quantities (bags/kilo/ton);
  greetings/self-introduction.
- **Travel** — numbers/time/days; immigration & customs (visa, arrival card, "nothing to declare");
  airport problems (delays, lost luggage); phone/WiFi/SIM; weather small-talk; explicit politeness
  formulas.

**Curriculum shape:** later "hard" missions need genuine A2 features (past tense — "My bag didn't
arrive"; "going to" future; comparatives; longer utterances) to justify a real 1→10 climb.
Re-sequence the greeting/small-talk missions (`travel-10`, `business-09`) toward the **front** and
add a genuinely harder capstone (e.g., handling problems/complaints) at the **end**.

---

## 8. Method & scope note

Each track was read in full (track file + all 10 mission files) against a shared rubric covering
the five required dimensions plus answer-key accuracy, IPA/meaning accuracy, duplicate/under-tested
vocab, and cross-mission sequencing. Findings above are the reviewer consensus with evidence quoted
inline. **This audit changed no code and no content** — all fixes above are recommendations for a
future authoring pass (which, per the Mission Library design, is data-only: edit `content/**` JSON +
re-run the seed; no engine change).
