import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

export const metadata: Metadata = { title: 'Progress' };

export default async function ProgressPage() {
  const user = await requireUser('/progress');
  const stats = await vocabulary.learner.getStats(user.id);
  const pct = Math.round(stats.completionRate * 100);

  const cards: { label: string; value: number | string }[] = [
    { label: 'Total words', value: stats.totalWords },
    { label: 'Studying', value: stats.studying },
    { label: 'Learned', value: stats.learned },
    { label: 'Due today', value: stats.dueToday },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning progress</h1>
        <p className="text-sm text-muted-foreground">
          Your vocabulary progress across the A1 corpus.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{stats.learned} learned</span>
            <span>{pct}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/review">Review due words</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/vocabulary">Add more words</Link>
        </Button>
      </div>
    </div>
  );
}
