import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Section 3 — Today's Review: two numbers that matter for spaced repetition —
 * how many words need review now, and how many are mastered. One CTA to review.
 */
export function TodaysReviewCard({
  needReview,
  mastered,
}: {
  needReview: number;
  mastered: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today&apos;s Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-4 text-center">
            <p className="text-3xl font-bold text-primary">{needReview}</p>
            <p className="text-xs text-muted-foreground">Need review</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-3xl font-bold text-success">{mastered}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </div>
        </div>
        <Button
          asChild
          className="w-full"
          variant={needReview > 0 ? 'default' : 'outline'}
        >
          <Link href="/review">
            {needReview > 0 ? 'Review now' : 'Review anyway'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
