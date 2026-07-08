'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Error state for the Learning Dashboard. Friendly, non-technical, with a retry — a data
 * hiccup should never leave the learner staring at a crash (UI_GUIDELINE §5).
 */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="text-3xl" aria-hidden="true">
            🌱
          </span>
          <div>
            <p className="font-semibold">
              We couldn&apos;t load your dashboard
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              It&apos;s not you — something hiccuped on our side. Your progress
              is safe. Let&apos;s try again.
            </p>
          </div>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
