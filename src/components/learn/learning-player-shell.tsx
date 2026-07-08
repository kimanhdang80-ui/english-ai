import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Presentational shell for the Learning Player (Sprint 3.1 = layout only):
 * a progress bar, a stage area for the current activity/exercise, and controls.
 * No player logic here — that arrives with the runtime engine.
 */
export function LearningPlayerShell({
  progressLabel = '0%',
  stage,
}: {
  progressLabel?: string;
  stage?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col gap-6">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{progressLabel}</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full w-0 bg-primary" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {stage ?? 'The current activity will render here.'}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" disabled>
          Back
        </Button>
        <Button disabled>Check</Button>
      </div>
    </div>
  );
}
