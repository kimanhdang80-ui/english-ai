import type { ReviewSnapshot } from '@/modules/daily-loop/domain/planning';
import type { ReviewSnapshotPort } from '@/modules/daily-loop/application/ports';
import type { ReviewQueueService } from '@/modules/daily-loop/application/services/review-queue-service';

/**
 * Adapts the existing `ReviewQueueService` to the planner's `ReviewSnapshotPort` — reuses
 * the real SRS-derived queue (due now / total / mastered); no new query, no duplication.
 */
export class ReviewQueueSnapshotAdapter implements ReviewSnapshotPort {
  constructor(private readonly reviewQueue: ReviewQueueService) {}

  async snapshot(userId: string): Promise<ReviewSnapshot> {
    const queue = await this.reviewQueue.getQueue(userId);
    return {
      dueNow: queue.dueNow,
      total: queue.total,
      mastered: queue.byStatus.mastered,
    };
  }
}
