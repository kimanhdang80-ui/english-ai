import Link from 'next/link';

import { AddToLearningButton } from '@/components/vocabulary/add-to-learning-button';
import { Card, CardContent } from '@/components/ui/card';
import type { VocabularySummary } from '@/modules/vocabulary/domain/entities';

/** Presentational row for the vocabulary list. */
export function VocabularyListItem({ item }: { item: VocabularySummary }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <Link
            href={`/vocabulary/${item.id}`}
            className="font-semibold hover:underline"
          >
            {item.word}
          </Link>
          {item.ipa ? (
            <span className="ml-2 text-sm text-muted-foreground">
              {item.ipa}
            </span>
          ) : null}
          <p className="truncate text-sm text-muted-foreground">
            {item.primaryPos ? (
              <span className="uppercase">{item.primaryPos} · </span>
            ) : null}
            {item.primaryDefinition ?? '—'}
          </p>
        </div>
        <AddToLearningButton vocabularyId={item.id} />
      </CardContent>
    </Card>
  );
}
