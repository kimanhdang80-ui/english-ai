/**
 * Vocabulary — application ports (repository interfaces). The hexagonal boundary:
 * services depend on these, infrastructure implements them with Prisma.
 * Pagination value objects are reused from the learning module (generic util).
 */
import type { Page, PageQuery } from '@/modules/learning/domain/pagination';

import type {
  ReviewCard,
  ReviewRating,
  Vocabulary,
  VocabularyStats,
  VocabularyStatus,
  VocabularySummary,
} from '@/modules/vocabulary/domain/entities';
import type { QuizItem } from '@/modules/vocabulary/domain/quiz';
import type { SrsResult } from '@/modules/vocabulary/domain/srs';

export interface VocabularyFilter {
  cefrLevelId?: string;
  tag?: string;
  search?: string;
}

export interface VocabularyRepository {
  list(
    filter: VocabularyFilter,
    page: PageQuery,
  ): Promise<Page<VocabularySummary>>;
  findById(id: string): Promise<Vocabulary | null>;
  quizItems(limit: number): Promise<QuizItem[]>;
}

/** Raw learner record used by the SRS use case (includes scheduler state). */
export interface UserVocabularyRecord {
  id: string;
  vocabularyId: string;
  status: VocabularyStatus;
  isFavorite: boolean;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
}

export interface UserVocabularyRepository {
  findByUserAndVocabulary(
    userId: string,
    vocabularyId: string,
  ): Promise<UserVocabularyRecord | null>;
  create(userId: string, vocabularyId: string): Promise<UserVocabularyRecord>;
  findForUser(id: string, userId: string): Promise<UserVocabularyRecord | null>;
  setFavorite(
    id: string,
    userId: string,
    isFavorite: boolean,
  ): Promise<UserVocabularyRecord>;
  /** Persist the SRS result and append a ReviewHistory row (transaction). */
  recordReview(params: {
    id: string;
    userId: string;
    rating: ReviewRating;
    prevIntervalDays: number;
    prevEase: number;
    result: SrsResult;
    now: Date;
  }): Promise<UserVocabularyRecord>;
  listDue(userId: string, now: Date, limit: number): Promise<ReviewCard[]>;
  listStudySet(userId: string, limit: number): Promise<ReviewCard[]>;
  stats(userId: string): Promise<VocabularyStats>;
}
