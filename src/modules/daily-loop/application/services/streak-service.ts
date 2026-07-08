import type { StreakInfo } from '@/modules/daily-loop/domain/entities';
import { computeStreak } from '@/modules/daily-loop/domain/streak';

import type { ReviewActivityRepository } from '@/modules/daily-loop/application/ports';

/** Streak derived from review activity (no dedicated table). */
export class StreakService {
  constructor(
    private readonly activity: ReviewActivityRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async forUser(userId: string): Promise<StreakInfo> {
    const today = this.clock().toISOString().slice(0, 10);
    const days = await this.activity.activeDays(userId, 90);
    return computeStreak(days, today);
  }
}
