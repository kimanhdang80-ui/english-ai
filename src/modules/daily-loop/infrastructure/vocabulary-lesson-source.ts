import 'server-only';

import type { ReviewCard } from '@/modules/vocabulary/domain/entities';
import type { QuizItem } from '@/modules/vocabulary/domain/quiz';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

import type { LessonSourcePort } from '@/modules/daily-loop/application/ports';

/** Bridges the daily loop to the vocabulary module (composition, not coupling). */
export class VocabularyLessonSource implements LessonSourcePort {
  quizItems(limit: number): Promise<QuizItem[]> {
    return vocabulary.catalog.getQuizItems(limit);
  }

  async dueReview(userId: string): Promise<ReviewCard | null> {
    const due = await vocabulary.learner.getTodayReviews(userId, 1);
    return due[0] ?? null;
  }

  studySet(userId: string, limit: number): Promise<ReviewCard[]> {
    return vocabulary.learner.getStudySet(userId, limit);
  }
}
