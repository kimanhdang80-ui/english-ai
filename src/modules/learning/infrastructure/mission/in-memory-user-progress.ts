import type { MissionProgress } from '@/modules/learning/domain/mission/entities';
import type { UserProgressPort } from '@/modules/learning/application/mission/ports';

/**
 * In-memory mission-progress store — **TEST-ONLY fake** (RC-03). The runtime now uses
 * `PrismaUserProgressRepository` (`mission_progress`, ADR-0005). Retained only as a test
 * double for the Mission Engine; not wired into any container.
 */
export class InMemoryUserProgressRepository implements UserProgressPort {
  private readonly byUser = new Map<string, Map<string, MissionProgress>>();

  async completedMissionIds(userId: string): Promise<string[]> {
    const missions = this.byUser.get(userId);
    if (!missions) return [];
    return [...missions.values()]
      .filter((p) => p.completedActivityIds.length > 0)
      .map((p) => p.missionId);
  }

  async missionProgress(
    userId: string,
    missionId: string,
  ): Promise<MissionProgress | null> {
    return this.byUser.get(userId)?.get(missionId) ?? null;
  }

  /** Test/authoring helper — records progress (not part of the read port). */
  async record(userId: string, progress: MissionProgress): Promise<void> {
    const missions = this.byUser.get(userId) ?? new Map();
    missions.set(progress.missionId, progress);
    this.byUser.set(userId, missions);
  }
}
