import type { Metadata } from 'next';
import Link from 'next/link';

import { VocabularyListItem } from '@/components/vocabulary/vocabulary-list-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toPageQuery } from '@/modules/learning/domain/pagination';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

export const metadata: Metadata = { title: 'Vocabulary' };

const PAGE_SIZE = 24;

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;
  const page = toPageQuery({ page: sp.page, pageSize: PAGE_SIZE });
  const result = await vocabulary.catalog.listVocabularies({ search }, page);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} A1 words · add words, then review them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/review">Today&apos;s review</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/vocabulary/flashcards">Flashcards</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/vocabulary/quiz">Quiz</Link>
          </Button>
        </div>
      </div>

      <form className="flex max-w-md gap-2">
        <Input
          name="q"
          defaultValue={search ?? ''}
          placeholder="Search words…"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {result.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No words found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.items.map((item) => (
            <VocabularyListItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between pt-2 text-sm">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={result.page <= 1}
          >
            <Link
              href={`/vocabulary?${new URLSearchParams({
                ...(search ? { q: search } : {}),
                page: String(result.page - 1),
              })}`}
            >
              Previous
            </Link>
          </Button>
          <span className="text-muted-foreground">
            Page {result.page} / {totalPages}
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={result.page >= totalPages}
          >
            <Link
              href={`/vocabulary?${new URLSearchParams({
                ...(search ? { q: search } : {}),
                page: String(result.page + 1),
              })}`}
            >
              Next
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
