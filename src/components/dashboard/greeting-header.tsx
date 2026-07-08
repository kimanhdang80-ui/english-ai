/**
 * Section 1 — Greeting: time-of-day hello + name, streak, and today's goal.
 * Presentational; the goal is derived from real signals (lesson + due reviews).
 */
function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader({
  displayName,
  hour,
  streak,
  dueNow,
}: {
  displayName: string | null;
  hour: number;
  streak: number;
  dueNow: number;
}) {
  const name = displayName?.trim();
  const reviewsPart =
    dueNow > 0 ? ` + ${dueNow} review${dueNow === 1 ? '' : 's'}` : '';

  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {greetingFor(hour)}
          {name ? `, ${name}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s goal — <span className="font-medium">1 lesson</span>
          {reviewsPart}. A little every day.
        </p>
      </div>
      <div
        className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
        aria-label={`${streak} day streak`}
      >
        <span className="text-2xl" aria-hidden="true">
          🔥
        </span>
        <div className="leading-tight">
          <p className="text-xl font-bold">{streak}</p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </div>
      </div>
    </header>
  );
}
