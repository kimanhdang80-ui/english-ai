import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayActivity } from '@/modules/daily-loop/domain/entities';

/**
 * Section 5 — Weekly Progress: a lightweight bar chart of reviews per day for the last 7
 * days (real data from review history). Pure CSS bars — no chart dependency. Empty state
 * when there's been no activity yet.
 */
const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeeklyProgressChart({ days }: { days: DayActivity[] }) {
  const total = days.reduce((sum, d) => sum + d.reviews, 0);
  const max = Math.max(1, ...days.map((d) => d.reviews));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">This week</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No reviews yet this week — finish today&apos;s lesson to start your
            chart.
          </p>
        ) : (
          <div
            className="flex items-end justify-between gap-2"
            aria-hidden="true"
          >
            {days.map((d) => {
              const heightPct = Math.round((d.reviews / max) * 100);
              const weekday = WEEKDAY[new Date(d.date).getUTCDay()] ?? '';
              return (
                <div
                  key={d.date}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div className="flex h-24 w-full items-end">
                    <div
                      className="w-full rounded-t bg-primary/80"
                      style={{
                        height: `${Math.max(heightPct, d.reviews ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {weekday}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {total > 0 ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {total} review{total === 1 ? '' : 's'} in the last 7 days
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
