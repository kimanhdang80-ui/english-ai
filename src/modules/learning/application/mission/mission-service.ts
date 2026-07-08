import type { CompletionStatus } from '@/modules/learning/domain/mission/completion-rule';
import type {
  LearningTrack,
  Mission,
  MissionActivity,
  MissionState,
} from '@/modules/learning/domain/mission/entities';

import { ActivityPlanner } from './activity-planner';
import { CompletionService } from './completion-service';
import { MissionPlanner, type MissionPlan } from './mission-planner';
import type { MissionRepository, UserProgressPort } from './ports';

export interface MissionView {
  mission: Mission;
  activities: MissionActivity[]; // ordered; availability reconciled
  state: MissionState;
  completion: CompletionStatus | null;
}

/**
 * Mission Service — the public facade of the Mission Engine. Composes the repository,
 * MissionPlanner, ActivityPlanner and CompletionService. Presentation/other modules use this;
 * they never touch the repository directly (hexagonal boundary).
 */
export class MissionService {
  private readonly activityPlanner = new ActivityPlanner();
  private readonly completion = new CompletionService();

  constructor(
    private readonly missions: MissionRepository,
    private readonly planner: MissionPlanner,
    private readonly progress: UserProgressPort,
  ) {}

  save(mission: Mission): Promise<void> {
    return this.missions.save(mission);
  }

  /** Choose today's mission from Goal + Review Queue + Progress + Track. */
  async planNextForUser(input: {
    userId: string;
    goal: { kind: string; cefr: string; dailyMinutes: number };
    reviewDueNow: number;
    track: LearningTrack;
  }): Promise<MissionPlan> {
    const completedMissionIds = await this.progress.completedMissionIds(
      input.userId,
    );
    return this.planner.plan({
      goal: input.goal,
      reviewDueNow: input.reviewDueNow,
      track: input.track,
      completedMissionIds,
    });
  }

  /** A mission with ordered activities + the learner's state/completion. */
  async getForUser(
    userId: string,
    missionId: string,
    unlocked = true,
  ): Promise<MissionView | null> {
    const mission = await this.missions.findById(missionId);
    if (!mission) return null;

    const progress = await this.progress.missionProgress(userId, missionId);
    const activities = this.activityPlanner.order(mission);
    const state = this.completion.stateFor(mission, progress, unlocked);
    const completion = progress
      ? this.completion.evaluate(mission, progress)
      : null;

    return { mission, activities, state, completion };
  }
}
