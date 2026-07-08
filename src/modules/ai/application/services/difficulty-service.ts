import type { DifficultyProfile } from '@/modules/ai/domain/entities';
import { DifficultyAdjuster } from '@/modules/ai/domain/difficulty-adjuster';

/** Application wrapper over the pure DifficultyAdjuster. */
export class DifficultyService {
  constructor(private readonly adjuster: DifficultyAdjuster) {}

  profileFor(level: string): DifficultyProfile {
    return this.adjuster.profileFor(level);
  }
}
