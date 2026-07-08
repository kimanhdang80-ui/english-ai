import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LearningSession } from '@/modules/daily-loop/domain/entities';

/**
 * Section 7 — Recent Activity: the most recent completed lesson (score + time).
 * Sessions persist once the `learning_sessions` store is wired (DEBT-016); until then this
 * shows a clean empty state.
 */
function durationLabel(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function RecentActivityCard({
  session,
}: {
  session: LearningSession | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!session ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No sessions yet — finish today&apos;s lesson to see it here.
          </p>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">Daily lesson</p>
              <p className="text-xs text-muted-foreground">
                {session.completedAt.slice(0, 10)}
              </p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="font-bold">
                  {session.quizScore}/{session.quizTotal}
                </p>
                <p className="text-xs text-muted-foreground">score</p>
              </div>
              <div>
                <p className="font-bold">{durationLabel(session.durationMs)}</p>
                <p className="text-xs text-muted-foreground">time</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
