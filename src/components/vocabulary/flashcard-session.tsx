'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, Volume2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiPatch } from '@/lib/api-client';
import type { ReviewCard } from '@/modules/vocabulary/domain/entities';

/**
 * Flashcard review session. Front = word + IPA + part of speech; back = meaning,
 * example, image (placeholder), audio. Buttons: Know, Review Again, Favorite.
 * Each grade calls PATCH /api/v1/user-vocabulary/:id and advances (SRS handled server-side).
 */
export function FlashcardSession({ cards }: { cards: ReviewCard[] }) {
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [known, setKnown] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [favorites, setFavorites] = React.useState<Record<string, boolean>>({});

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No cards to review right now.</p>
          <Button asChild variant="outline">
            <Link href="/vocabulary">Add more words</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (index >= cards.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-lg font-semibold">Session complete 🎉</p>
          <p className="text-sm text-muted-foreground">
            You reviewed {cards.length} cards · knew {known}.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/progress">See progress</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const card = cards[index]!;
  const { vocabulary: v } = card;
  const ipa = v.pronunciations[0]?.ipa;
  const meaning = v.meanings[0];
  const example = v.examples[0];
  const image = v.images[0];
  const audio = v.audios[0];
  const isFav = favorites[card.state.id] ?? card.state.isFavorite;

  async function grade(rating: 'good' | 'again') {
    if (busy) return;
    setBusy(true);
    try {
      await apiPatch(`/api/v1/user-vocabulary/${card.state.id}`, { rating });
      if (rating === 'good') setKnown((k) => k + 1);
    } catch {
      // keep the card in place on failure
    } finally {
      setBusy(false);
      setRevealed(false);
      setIndex((i) => i + 1);
    }
  }

  async function toggleFavorite() {
    const next = !isFav;
    setFavorites((f) => ({ ...f, [card.state.id]: next }));
    try {
      await apiPatch(`/api/v1/user-vocabulary/${card.state.id}`, {
        isFavorite: next,
      });
    } catch {
      setFavorites((f) => ({ ...f, [card.state.id]: !next }));
    }
  }

  function playAudio() {
    if (audio?.url) new Audio(audio.url).play().catch(() => {});
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Card {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          onClick={toggleFavorite}
          className="inline-flex items-center gap-1 hover:text-foreground"
          aria-pressed={isFav}
          aria-label="Favorite"
        >
          <Heart
            className={isFav ? 'fill-accent text-accent' : ''}
            aria-hidden="true"
          />
          Favorite
        </button>
      </div>

      <Card>
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold">{v.word}</h2>
            {audio ? (
              <button type="button" onClick={playAudio} aria-label="Play audio">
                <Volume2
                  className="text-muted-foreground hover:text-foreground"
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </div>
          {ipa ? <p className="text-muted-foreground">{ipa}</p> : null}
          {meaning ? (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {meaning.partOfSpeech}
            </p>
          ) : null}

          {revealed ? (
            <div className="mt-4 w-full space-y-3 border-t pt-4">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.url}
                  alt={image.alt ?? v.word}
                  className="mx-auto h-28 rounded-md object-cover"
                />
              ) : (
                <div className="mx-auto flex h-28 w-full max-w-xs items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                  No image
                </div>
              )}
              {meaning ? (
                <p className="font-medium">
                  {meaning.definition}
                  {meaning.translation ? (
                    <span className="block text-sm text-muted-foreground">
                      {meaning.translation}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {example ? (
                <p className="text-sm italic text-muted-foreground">
                  “{example.text}”
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {revealed ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => grade('again')}
              disabled={busy}
            >
              Review again
            </Button>
            <Button onClick={() => grade('good')} disabled={busy}>
              Know
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            “Know” = you remembered it (comes back later) · “Review again” =
            shows it again soon.
          </p>
        </div>
      ) : (
        <Button className="w-full" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      )}
    </div>
  );
}
