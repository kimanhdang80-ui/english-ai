import type {
  ReviewQueueItem,
  ReviewQueueStatus,
  ReviewQueueSummary,
} from '@/modules/daily-loop/domain/entities';
import { toReviewQueueStatus } from '@/modules/daily-loop/domain/status-mapping';

import type { LessonSourcePort } from '@/modules/daily-loop/application/ports';

/**
 * Builds the review queue by mapping the learner's SRS study set to the display
 * statuses NEW / LEARNING / REVIEW / MASTERED. Read-only; no stored value changes.
 */
export class ReviewQueueService {
  constructor(
    private readonly source: LessonSourcePort,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async getQueue(userId: string, limit = 100): Promise<ReviewQueueSummary> {
    const nowISO = this.clock().toISOString();
    const cards = await this.source.studySet(userId, limit);

    const items: ReviewQueueItem[] = cards.map((c) => ({
      userVocabularyId: c.state.id,
      vocabularyId: c.vocabulary.id,
      word: c.vocabulary.word,
      status: toReviewQueueStatus(c.state.status, c.state.dueAt, nowISO),
      dueAt: c.state.dueAt,
    }));

    const byStatus: Record<ReviewQueueStatus, number> = {
      new: 0,
      learning: 0,
      review: 0,
      mastered: 0,
    };
    for (const item of items) byStatus[item.status] += 1;

    return {
      total: items.length,
      dueNow: byStatus.review,
      byStatus,
      items,
    };
  }
}
