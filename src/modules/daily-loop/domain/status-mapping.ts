import type { ReviewQueueStatus } from './entities';

/** SRS learner status (from the vocabulary module). */
export type VocabularyStatus = 'new' | 'learning' | 'known' | 'mastered';

/**
 * Maps a learner's SRS state to the review-queue display status (pure). A word that is
 * due now (and not mastered) surfaces as `review`; otherwise it reflects its learning
 * stage. This is a presentation mapping — it does not change any stored value.
 */
export function toReviewQueueStatus(
  status: VocabularyStatus,
  dueAtISO: string,
  nowISO: string,
): ReviewQueueStatus {
  if (status === 'mastered') return 'mastered';
  const due = new Date(dueAtISO).getTime() <= new Date(nowISO).getTime();
  if (due) return 'review';
  if (status === 'new') return 'new';
  return 'learning';
}

export const REVIEW_QUEUE_STATUSES: ReviewQueueStatus[] = [
  'new',
  'learning',
  'review',
  'mastered',
];
