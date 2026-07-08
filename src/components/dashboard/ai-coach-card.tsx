import { Card, CardContent } from '@/components/ui/card';
import type { CoachMessage } from '@/lib/dashboard/coach-message';

/**
 * Section 4 — AI Coach card. Renders a single, human, next-step message from the coach.
 * The message is produced upstream (`buildCoachMessage`, a mock today) so this component is
 * unchanged when a real AI provider takes over — see docs/product/AI_DAILY_COACH.md.
 */
export function AiCoachCard({ message }: { message: CoachMessage }) {
  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="flex gap-3 py-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-lg"
          aria-hidden="true"
        >
          🧑‍🏫
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Coach Mai{message.source === 'mock' ? ' · preview' : ''}
          </p>
          <p className="mt-0.5 text-sm">{message.text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
