import type {
  Mission,
  MissionProgress,
} from '@/modules/learning/domain/mission/entities';

/**
 * Mission Engine ports. Implemented by infrastructure (in-memory today; a Prisma
 * `missions`/`mission_activities` repo lands via the V2 migration DB gate — P2).
 */
export interface MissionRepository {
  findById(id: string): Promise<Mission | null>;
  listByTrack(trackId: string): Promise<Mission[]>;
  save(mission: Mission): Promise<void>;
}

/** Reads the learner's mission progress (completed missions + per-mission progress). */
export interface UserProgressPort {
  completedMissionIds(userId: string): Promise<string[]>;
  missionProgress(
    userId: string,
    missionId: string,
  ): Promise<MissionProgress | null>;
}
