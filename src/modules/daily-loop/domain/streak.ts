import type { StreakInfo } from './entities';

/** Shift a `YYYY-MM-DD` day by `delta` days (UTC, pure). */
export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute streak info from a set of active days (pure, deterministic given `today`).
 * `current` counts consecutive active days ending today (or yesterday, as a grace day
 * so the streak isn't shown as broken until a full day is missed). `longest` is the
 * longest consecutive run anywhere in the history.
 */
export function computeStreak(activeDays: string[], today: string): StreakInfo {
  const set = new Set(activeDays);
  if (set.size === 0) {
    return { current: 0, longest: 0, lastActiveDate: null };
  }

  // current run
  let cursor: string | null = null;
  if (set.has(today)) cursor = today;
  else if (set.has(shiftDay(today, -1))) cursor = shiftDay(today, -1);

  let current = 0;
  while (cursor && set.has(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  // longest run
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && shiftDay(prev, 1) === day ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }

  return {
    current,
    longest,
    lastActiveDate: sorted[sorted.length - 1] ?? null,
  };
}
