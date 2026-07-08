/**
 * Daily Lesson Planner — domain read models (framework-free, pure). Implements the
 * Learning Model V2 planning vocabulary: Goal → Track → Mission → Activities → Lesson.
 *
 * Design notes (docs/DAILY_LEARNING_ALGORITHM.md):
 * - The planner decides **structure** (which mission, which activities, difficulty) from
 *   real signals — it does NOT invent learning content (words/quiz come from the corpus).
 * - No hard-coded content, no randomness: every decision is derived deterministically from
 *   the review snapshot + learner profile via the Rule Engine (AI is an optional advisor).
 */

export type LearningGoalKind =
  'general' | 'conversation' | 'exam' | 'business' | 'kids';

/** How today's lesson is shaped by the review load. */
export type LessonStrategy = 'review_focus' | 'balanced' | 'new_mission';

export type DifficultyBand = 'consolidate' | 'steady' | 'stretch';

/** Activity taxonomy for V2 (Vocabulary → Dialogue → Quiz → Review). */
export type ActivityKind = 'vocabulary' | 'dialogue' | 'quiz' | 'review';

export type PlanDecidedBy = 'ai' | 'rule';

export interface DailyGoal {
  kind: LearningGoalKind;
  label: string; // presentation label, e.g. "Everyday English"
  dailyMinutes: number;
  cefr: string; // e.g. 'A1'
}

export interface LearningTrack {
  id: string; // derived, e.g. 'general-a1'
  title: string; // e.g. "Everyday English · A1"
  goal: LearningGoalKind;
  cefr: string;
}

export interface Mission {
  id: string; // derived, e.g. 'general-a1-set-3'
  trackId: string;
  title: string; // e.g. "Everyday English · A1 — Set 3"
  learningGoal: string; // human goal, e.g. "Learn 8 new A1 words you can use today."
  cefr: string;
  newWordCount: number;
  estimatedMinutes: number;
}

export interface PlannedActivity {
  kind: ActivityKind;
  /** Same taxonomy as `kind`; kept explicit to mirror the V2 Activity.skill field. */
  skill: ActivityKind;
  title: string;
  itemCount: number;
  estimatedMinutes: number;
  /** false = the algorithm planned this step but no content exists yet (e.g. dialogue). */
  available: boolean;
}

export interface CompletionCriteria {
  wordsToStudy: number;
  quizToAnswer: number;
  reviewsToClear: number;
  summary: string; // human-readable
}

/** Real signals the planner reads (no fabricated data). */
export interface ReviewSnapshot {
  dueNow: number;
  total: number;
  mastered: number;
}

export interface LearnerProfileInfo {
  goal: LearningGoalKind;
  cefr: string;
  dailyMinutes: number;
}

/** The structural decision (from AI advisor or Rule Engine). */
export interface PlanDecision {
  strategy: LessonStrategy;
  newWordCount: number;
  reviewCount: number;
  quizCount: number;
  difficulty: DifficultyBand;
  activityKinds: ActivityKind[];
  decidedBy: PlanDecidedBy;
  rationale: string;
}

export interface LessonPlan {
  date: string; // YYYY-MM-DD
  goal: DailyGoal;
  track: LearningTrack;
  mission: Mission | null; // null on review-focus days (no new mission)
  strategy: LessonStrategy;
  difficulty: DifficultyBand;
  activities: PlannedActivity[];
  estimatedMinutes: number;
  completionCriteria: CompletionCriteria;
  decidedBy: PlanDecidedBy;
  rationale: string;
}

/** Compact, UI-facing view attached to `DailyLesson` (additive/backward-compatible). */
export interface LessonPlanView {
  missionTitle: string;
  learningGoal: string;
  estimatedMinutes: number;
  difficulty: DifficultyBand;
  strategy: LessonStrategy;
  activities: {
    kind: ActivityKind;
    title: string;
    itemCount: number;
    available: boolean;
  }[];
  completionCriteria: CompletionCriteria;
  decidedBy: PlanDecidedBy;
}

/** Presentation labels per goal (not learning content). */
export const GOAL_LABELS: Record<LearningGoalKind, string> = {
  general: 'Everyday English',
  conversation: 'Conversation English',
  exam: 'Exam English',
  business: 'Business English',
  kids: 'English for Kids',
};

/** Deterministic time model (minutes) — configuration, not content. */
export const TIME_COST = {
  perNewWord: 0.7,
  perQuiz: 0.4,
  perReview: 0.3,
  dialogue: 3,
} as const;

/** Estimated lesson minutes for a set of counts (rounded up to a whole minute). */
export function estimateLessonMinutes(counts: {
  newWords: number;
  quiz: number;
  reviews: number;
  includeDialogue: boolean;
}): number {
  const minutes =
    counts.newWords * TIME_COST.perNewWord +
    counts.quiz * TIME_COST.perQuiz +
    counts.reviews * TIME_COST.perReview +
    (counts.includeDialogue ? TIME_COST.dialogue : 0);
  return Math.max(1, Math.ceil(minutes));
}

export function toLessonPlanView(plan: LessonPlan): LessonPlanView {
  return {
    missionTitle: plan.mission?.title ?? `${plan.goal.label} · Review`,
    learningGoal:
      plan.mission?.learningGoal ?? 'Strengthen the words you already know.',
    estimatedMinutes: plan.estimatedMinutes,
    difficulty: plan.difficulty,
    strategy: plan.strategy,
    activities: plan.activities.map((a) => ({
      kind: a.kind,
      title: a.title,
      itemCount: a.itemCount,
      available: a.available,
    })),
    completionCriteria: plan.completionCriteria,
    decidedBy: plan.decidedBy,
  };
}
