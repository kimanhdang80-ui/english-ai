import { NotFoundError } from '@/lib/errors';

import type {
  ReviewCard,
  ReviewRating,
  UserVocabularyState,
  VocabularyStats,
} from '@/modules/vocabulary/domain/entities';
import { schedule } from '@/modules/vocabulary/domain/srs';
import type {
  UserVocabularyRecord,
  UserVocabularyRepository,
} from '@/modules/vocabulary/application/ports';

function toState(r: UserVocabularyRecord): UserVocabularyState {
  return {
    id: r.id,
    vocabularyId: r.vocabularyId,
    status: r.status,
    isFavorite: r.isFavorite,
    ease: r.ease,
    intervalDays: r.intervalDays,
    repetitions: r.repetitions,
    dueAt: r.dueAt,
    lastReviewedAt: r.lastReviewedAt,
  };
}

/**
 * Learner-facing vocabulary use cases: add words, review (SRS), favorite, and the
 * "today" queue + progress stats. Scheduling math lives in the pure `schedule()`
 * domain function — the service only orchestrates load → compute → persist.
 */
export class UserVocabularyService {
  constructor(
    private readonly repo: UserVocabularyRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** Idempotent: adds a word to the learner's set (or returns the existing entry). */
  async addToLearning(
    userId: string,
    vocabularyId: string,
  ): Promise<UserVocabularyState> {
    const existing = await this.repo.findByUserAndVocabulary(
      userId,
      vocabularyId,
    );
    if (existing) return toState(existing);
    const created = await this.repo.create(userId, vocabularyId);
    return toState(created);
  }

  /** Apply a review grade and reschedule via SRS. */
  async review(
    userId: string,
    userVocabularyId: string,
    rating: ReviewRating,
  ): Promise<UserVocabularyState> {
    const record = await this.repo.findForUser(userVocabularyId, userId);
    if (!record) throw new NotFoundError('UserVocabulary', userVocabularyId);

    const now = this.clock();
    const result = schedule(
      {
        ease: record.ease,
        intervalDays: record.intervalDays,
        repetitions: record.repetitions,
        lapses: record.lapses,
      },
      rating,
      now,
    );
    const updated = await this.repo.recordReview({
      id: userVocabularyId,
      userId,
      rating,
      prevIntervalDays: record.intervalDays,
      prevEase: record.ease,
      result,
      now,
    });
    return toState(updated);
  }

  async setFavorite(
    userId: string,
    userVocabularyId: string,
    isFavorite: boolean,
  ): Promise<UserVocabularyState> {
    const record = await this.repo.findForUser(userVocabularyId, userId);
    if (!record) throw new NotFoundError('UserVocabulary', userVocabularyId);
    const updated = await this.repo.setFavorite(
      userVocabularyId,
      userId,
      isFavorite,
    );
    return toState(updated);
  }

  getTodayReviews(userId: string, limit = 50): Promise<ReviewCard[]> {
    return this.repo.listDue(userId, this.clock(), limit);
  }

  getStudySet(userId: string, limit = 50): Promise<ReviewCard[]> {
    return this.repo.listStudySet(userId, limit);
  }

  getStats(userId: string): Promise<VocabularyStats> {
    return this.repo.stats(userId);
  }
}
