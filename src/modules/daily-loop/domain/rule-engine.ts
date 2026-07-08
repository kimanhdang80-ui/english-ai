import {
  estimateLessonMinutes,
  type DailyGoal,
  type DifficultyBand,
  type ActivityKind,
  type LessonStrategy,
  type PlanDecision,
  type ReviewSnapshot,
} from './planning';

/**
 * Rule Engine — the deterministic decision core. It chooses the lesson **shape** (strategy,
 * how many new words / reviews / quiz questions, difficulty, activity order) from the review
 * load and the learner's time budget. It is:
 *  - the **default** decider today (no content AI wired), and
 *  - the **fallback** whenever the AI advisor is unavailable/declines/fails.
 *
 * Thresholds are named configuration (not hard-coded content). See DAILY_LEARNING_ALGORITHM.md.
 */
export const PLANNER_RULES = {
  /** Above this many due reviews → review-focus (no new words). */
  REVIEW_HEAVY_THRESHOLD: 20,
  /** Below this many due reviews → add a new mission (more new words). */
  REVIEW_LIGHT_THRESHOLD: 5,
  NEW_WORDS_BALANCED: 5,
  NEW_WORDS_NEW_MISSION: 8,
  /** Max reviews pulled into one session, by strategy. */
  REVIEW_CAP_FOCUS: 20,
  REVIEW_CAP_DEFAULT: 10,
  QUIZ_MAX: 5,
  QUIZ_MIN: 3,
} as const;

export interface RuleEngineInput {
  review: ReviewSnapshot;
  goal: DailyGoal;
}

function difficultyFor(strategy: LessonStrategy): DifficultyBand {
  if (strategy === 'review_focus') return 'consolidate';
  if (strategy === 'new_mission') return 'stretch';
  return 'steady';
}

function quizCountFor(newWords: number, reviews: number): number {
  const base = newWords > 0 ? newWords : reviews;
  if (base <= 0) return 0;
  return Math.min(
    PLANNER_RULES.QUIZ_MAX,
    Math.max(PLANNER_RULES.QUIZ_MIN, base),
  );
}

function activityOrder(newWords: number, reviews: number): ActivityKind[] {
  const kinds: ActivityKind[] = [];
  if (newWords > 0) {
    kinds.push('vocabulary', 'dialogue');
  }
  if (quizCountFor(newWords, reviews) > 0) kinds.push('quiz');
  if (reviews > 0) kinds.push('review');
  return kinds;
}

export class RuleEngine {
  /**
   * Decide the lesson shape. Deterministic: same inputs → same output.
   * Pipeline: pick strategy by review load → set raw counts → **time-box** to the daily
   * minutes budget (trim new words first, then reviews) → derive quiz/difficulty/order.
   */
  decide({ review, goal }: RuleEngineInput): PlanDecision {
    const due = Math.max(0, review.dueNow);

    let strategy: LessonStrategy;
    let newWordCount: number;
    let reviewCount: number;

    if (due > PLANNER_RULES.REVIEW_HEAVY_THRESHOLD) {
      strategy = 'review_focus';
      newWordCount = 0;
      reviewCount = Math.min(due, PLANNER_RULES.REVIEW_CAP_FOCUS);
    } else if (due < PLANNER_RULES.REVIEW_LIGHT_THRESHOLD) {
      strategy = 'new_mission';
      newWordCount = PLANNER_RULES.NEW_WORDS_NEW_MISSION;
      reviewCount = Math.min(due, PLANNER_RULES.REVIEW_CAP_DEFAULT);
    } else {
      strategy = 'balanced';
      newWordCount = PLANNER_RULES.NEW_WORDS_BALANCED;
      reviewCount = Math.min(due, PLANNER_RULES.REVIEW_CAP_DEFAULT);
    }

    // Time-box to the learner's daily budget (deterministic trim).
    const budget = Math.max(5, goal.dailyMinutes);
    const overBudget = () =>
      estimateLessonMinutes({
        newWords: newWordCount,
        quiz: quizCountFor(newWordCount, reviewCount),
        reviews: reviewCount,
        includeDialogue: newWordCount > 0,
      }) > budget;
    while (overBudget() && newWordCount > 0) newWordCount -= 1;
    while (overBudget() && reviewCount > 0) reviewCount -= 1;

    const quizCount = quizCountFor(newWordCount, reviewCount);
    const difficulty = difficultyFor(strategy);

    const rationale =
      strategy === 'review_focus'
        ? `${due} words are due (> ${PLANNER_RULES.REVIEW_HEAVY_THRESHOLD}) — focus on review, no new words today.`
        : strategy === 'new_mission'
          ? `Only ${due} words due (< ${PLANNER_RULES.REVIEW_LIGHT_THRESHOLD}) — room for a new mission.`
          : `${due} words due — a balanced mix of new words and review.`;

    return {
      strategy,
      newWordCount,
      reviewCount,
      quizCount,
      difficulty,
      activityKinds: activityOrder(newWordCount, reviewCount),
      decidedBy: 'rule',
      rationale,
    };
  }
}
