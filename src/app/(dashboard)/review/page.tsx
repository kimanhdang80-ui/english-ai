import type { Metadata } from 'next';

import { FlashcardSession } from '@/components/vocabulary/flashcard-session';
import { requireUser } from '@/lib/auth/session';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

export const metadata: Metadata = { title: "Today's Review" };

export default async function TodaysReviewPage() {
  const user = await requireUser('/review');
  const cards = await vocabulary.learner.getTodayReviews(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today&apos;s review</h1>
        <p className="text-sm text-muted-foreground">
          {cards.length} card{cards.length === 1 ? '' : 's'} due — spaced
          repetition keeps them fresh.
        </p>
      </div>
      <FlashcardSession cards={cards} />
    </div>
  );
}
