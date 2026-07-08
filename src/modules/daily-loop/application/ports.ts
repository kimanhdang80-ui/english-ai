/**
 * Daily Loop — application ports. The `ExplanationPort` is the AI seam: a mock adapter
 * implements it now; a real AI adapter drops in later with no service changes.
 */
import type {
  DayActivity,
  Explanation,
  LearningSession,
  LearningSessionInput,
} from '@/modules/daily-loop/domain/entities';
import type {
  DailyGoal,
  LearnerProfileInfo,
  LessonPlan,
  PlanDecision,
  ReviewSnapshot,
} from '@/modules/daily-loop/domain/planning';
import type { ReviewCard } from '@/modules/vocabulary/domain/entities';
import type { QuizItem } from '@/modules/vocabulary/domain/quiz';

export interface ExplanationInput {
  word: string;
  definition: string;
  example?: string | null;
}

export interface ExplanationPort {
  readonly source: string;
  explainWord(input: ExplanationInput): Promise<Explanation>;
}

/** Reads derived from the existing `review_history` — NO new tables. */
export interface ReviewActivityRepository {
  /** Distinct active days (`YYYY-MM-DD`) within the window. */
  activeDays(userId: string, sinceDays: number): Promise<string[]>;
  /** Per-day review counts for recent activity. */
  recentActivity(userId: string, days: number): Promise<DayActivity[]>;
}

/**
 * Learning-session store. In-memory SKELETON this sprint (ephemeral) — persistence
 * needs a `learning_sessions` table via the DB gate (tracked as debt).
 */
export interface SessionRepository {
  append(session: LearningSession): Promise<void>;
  list(userId: string, limit: number): Promise<LearningSession[]>;
}

/** Bridges to the vocabulary module without leaking its internals. */
export interface LessonSourcePort {
  quizItems(limit: number): Promise<QuizItem[]>;
  dueReview(userId: string): Promise<ReviewCard | null>;
  studySet(userId: string, limit: number): Promise<ReviewCard[]>;
}

// --- Daily Lesson Planner ports (Task 02) ---

/** Read-only review load used by the planner (adapts the review queue). */
export interface ReviewSnapshotPort {
  snapshot(userId: string): Promise<ReviewSnapshot>;
}

/** Reads the learner's goal/CEFR/time budget (with safe defaults for new learners). */
export interface LearnerProfilePort {
  get(userId: string): Promise<LearnerProfileInfo>;
}

/**
 * Persists the generated lesson plan ("Lưu Lesson Plan"). In-memory skeleton today
 * (ephemeral) — a durable store lands via the DB gate, same pattern as sessions (DEBT-016).
 */
export interface LessonPlanRepository {
  save(userId: string, plan: LessonPlan): Promise<void>;
  latest(userId: string): Promise<LessonPlan | null>;
}

/**
 * Optional AI advisor. It decides STRUCTURE only (which mission/activities/difficulty),
 * never content. Returns `null` (or throws) when unavailable → the Rule Engine decides.
 */
export interface LessonPlannerAiPort {
  readonly configured: boolean;
  decide(input: {
    review: ReviewSnapshot;
    goal: DailyGoal;
  }): Promise<PlanDecision | null>;
}

export type { LearningSessionInput };
