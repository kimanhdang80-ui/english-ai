import type { Metadata } from 'next';

import { FlashcardSession } from '@/components/vocabulary/flashcard-session';
import { requireUser } from '@/lib/auth/session';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

export const metadata: Metadata = { title: 'Flashcards' };

export default async function FlashcardsPage() {
  const user = await requireUser('/vocabulary/flashcards');
  const cards = await vocabulary.learner.getStudySet(user.id, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <p className="text-sm text-muted-foreground">
          Practice the words in your set.
        </p>
      </div>
      <FlashcardSession cards={cards} />
    </div>
  );
}
