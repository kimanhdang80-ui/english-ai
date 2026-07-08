import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReviewQueueStatus } from '@/modules/daily-loop/domain/entities';

/** A word the learner is still building — real, derived from review-queue status. */
export interface WeakWord {
  word: string;
  status: ReviewQueueStatus;
}

const STATUS_LABEL: Record<ReviewQueueStatus, string> = {
  new: 'New',
  learning: 'Learning',
  review: 'To review',
  mastered: 'Mastered',
};

/**
 * Section 6 — Weak Words: the top words the learner still needs to strengthen (status
 * `learning`/`review`, not yet mastered). Real data from the review queue; empty state
 * when nothing needs work. (When per-word error tracking lands, ranking can use miss-rate.)
 */
export function WeakWordsCard({ words }: { words: WeakWord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Words to strengthen</CardTitle>
      </CardHeader>
      <CardContent>
        {words.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing to strengthen right now — great work. Add words in{' '}
            <Link href="/vocabulary" className="text-primary hover:underline">
              Vocabulary
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y">
            {words.map((w, i) => (
              <li
                key={w.word}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {i + 1}.
                  </span>
                  <span className="font-medium">{w.word}</span>
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {STATUS_LABEL[w.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
