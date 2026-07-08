import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddToLearningButton } from '@/components/vocabulary/add-to-learning-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotFoundError } from '@/lib/errors';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';
import type { Vocabulary } from '@/modules/vocabulary/domain/entities';

export const metadata: Metadata = { title: 'Word' };

export default async function VocabularyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let word: Vocabulary;
  try {
    word = await vocabulary.catalog.getVocabulary(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const ipa = word.pronunciations[0]?.ipa;
  const image = word.images[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/vocabulary"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Vocabulary
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{word.word}</h1>
          {ipa ? <p className="text-muted-foreground">{ipa}</p> : null}
        </div>
        <AddToLearningButton vocabularyId={word.id} />
      </div>

      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={image.alt ?? word.word}
          className="h-40 w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          No image yet
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meanings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {word.meanings.map((m) => (
            <div key={m.id}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {m.partOfSpeech}
              </p>
              <p className="font-medium">{m.definition}</p>
              {m.translation ? (
                <p className="text-sm text-muted-foreground">{m.translation}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {word.examples.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {word.examples.map((e) => (
              <p key={e.id} className="text-sm italic text-muted-foreground">
                “{e.text}”
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {word.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {word.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
