import 'server-only';

import { isAiConfigured } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { ai } from '@/modules/ai/infrastructure/container';

import { DailyLessonService } from '@/modules/daily-loop/application/services/daily-lesson-service';
import { LearningHistoryService } from '@/modules/daily-loop/application/services/learning-history-service';
import { LessonPlannerService } from '@/modules/daily-loop/application/services/lesson-planner-service';
import { ReviewQueueService } from '@/modules/daily-loop/application/services/review-queue-service';
import { StreakService } from '@/modules/daily-loop/application/services/streak-service';

import { AiExplanationAdapter } from './ai-explanation-adapter';
import { MockExplanationAdapter } from './mock-explanation-adapter';
import { PrismaLearnerProfileRepository } from './prisma-learner-profile-repository';
import { PrismaLessonPlanRepository } from './prisma-lesson-plan-repository';
import { PrismaReviewActivityRepository } from './prisma-review-activity-repository';
import { PrismaSessionRepository } from './prisma-session-repository';
import { ReviewQueueSnapshotAdapter } from './review-queue-snapshot-adapter';
import { VocabularyLessonSource } from './vocabulary-lesson-source';

/**
 * Composition root for the Daily Loop. The daily lesson is now produced by the
 * **Lesson Planner** (Task 02): it decides the shape (Rule Engine today; AI advisor is an
 * optional future adapter — passed `null`, so the Rule Engine is the deterministic default
 * AND fallback), then `DailyLessonService` materializes real content from the corpus.
 *
 * RC-03: sessions and lesson plans are now persisted via Prisma (`learning_sessions` /
 * `lesson_plans`, ADR-0005) — no in-memory stores remain in the runtime.
 */
const source = new VocabularyLessonSource();
const explanation = isAiConfigured
  ? new AiExplanationAdapter(ai.text)
  : new MockExplanationAdapter();
const activity = new PrismaReviewActivityRepository(prisma);
const sessions = new PrismaSessionRepository(prisma);

const reviewQueue = new ReviewQueueService(source);
const planner = new LessonPlannerService(
  new ReviewQueueSnapshotAdapter(reviewQueue),
  new PrismaLearnerProfileRepository(prisma),
  new PrismaLessonPlanRepository(prisma),
  null, // AI advisor not wired yet → Rule Engine decides (deterministic)
);

export const dailyLoop = {
  lesson: new DailyLessonService(planner, source, explanation),
  planner,
  reviewQueue,
  streak: new StreakService(activity),
  history: new LearningHistoryService(sessions, activity),
  explanation,
};

export type DailyLoopContainer = typeof dailyLoop;
