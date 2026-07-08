import 'server-only';

import type { PrismaClient } from '@prisma/client';

import type { DayActivity } from '@/modules/daily-loop/domain/entities';
import type { ReviewActivityRepository } from '@/modules/daily-loop/application/ports';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Streak/activity **derived from the existing `review_history`** — no new table
 * (respects the DB gate). Days are computed in UTC.
 */
export class PrismaReviewActivityRepository implements ReviewActivityRepository {
  constructor(private readonly db: PrismaClient) {}

  async activeDays(userId: string, sinceDays: number): Promise<string[]> {
    const since = new Date(Date.now() - sinceDays * DAY_MS);
    const rows = await this.db.reviewHistory.findMany({
      where: { userId, reviewedAt: { gte: since } },
      select: { reviewedAt: true },
    });
    const set = new Set(
      rows.map((r) => r.reviewedAt.toISOString().slice(0, 10)),
    );
    return [...set];
  }

  async recentActivity(userId: string, days: number): Promise<DayActivity[]> {
    const since = new Date(Date.now() - days * DAY_MS);
    const rows = await this.db.reviewHistory.findMany({
      where: { userId, reviewedAt: { gte: since } },
      select: { reviewedAt: true },
    });
    const counts = new Map<string, number>();
    for (const r of rows) {
      const day = r.reviewedAt.toISOString().slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([date, reviews]) => ({ date, reviews }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }
}
