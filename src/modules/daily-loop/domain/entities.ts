/**
 * Daily Learning Loop — domain read models (framework-free). This module **composes**
 * the vocabulary module into a complete daily experience; it adds no new persistence.
 */
import type { QuizQuestion } from '@/modules/vocabulary/domain/quiz';
import type { LessonPlanView } from './planning';

/** Presentation status for the review queue (derived from SRS state; NOT a DB column). */
export type ReviewQueueStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface ReviewQueueItem {
  userVocabularyId: string;
  vocabularyId: string;
  word: string;
  status: ReviewQueueStatus;
  dueAt: string;
}

export interface ReviewQueueSummary {
  total: number;
  dueNow: number;
  byStatus: Record<ReviewQueueStatus, number>;
  items: ReviewQueueItem[];
}

export interface DailyLessonWord {
  vocabularyId: string;
  word: string;
  definition: string;
  example: string | null;
}

/** A quiz question plus a (mock) explanation shown for wrong answers. */
export type DailyQuizQuestion = QuizQuestion & { explanation: string };

export interface DailyLesson {
  date: string; // YYYY-MM-DD
  words: DailyLessonWord[]; // sized by the plan (0 on review-focus → materialized from review set)
  quiz: DailyQuizQuestion[];
  reviewWord: DailyLessonWord | null; // 1 due review, if any
  reviewUserVocabularyId: string | null;
  /** V2 lesson plan (mission, goal, estimated time, activities). Additive/backward-compatible. */
  plan?: LessonPlanView;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  reviews: number;
}

export interface LearningSessionInput {
  userId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  wordsStudied: number;
  quizScore: number;
  quizTotal: number;
}

export interface LearningSession extends LearningSessionInput {
  id: string;
}

export interface Explanation {
  text: string;
  source: string; // e.g. 'mock' — becomes 'ai' when a provider is wired
}
