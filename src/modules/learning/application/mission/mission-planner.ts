import type {
  LearningTrack,
  Mission,
} from '@/modules/learning/domain/mission/entities';

import type { MissionRepository } from './ports';

/**
 * Threshold (mirrors docs/DAILY_LEARNING_ALGORITHM.md). Kept local to avoid a wrong-direction
 * dependency on the daily-loop module; the value is the same review-heavy cut-off.
 */
export const MISSION_REVIEW_HEAVY_THRESHOLD = 20;

/** What the planner reads to choose a mission (Daily Goal, Review Queue, Progress, Track). */
export interface MissionPlannerContext {
  goal: { kind: string; cefr: string; dailyMinutes: number };
  reviewDueNow: number;
  track: LearningTrack;
  completedMissionIds: string[];
}

export type MissionPlanReason =
  | 'review_focus' // too many reviews due → skip a new mission today
  | 'next_mission' // picked the next uncompleted mission in the track
  | 'track_complete'; // no uncompleted missions remain

export interface MissionPlan {
  mission: Mission | null;
  reason: MissionPlanReason;
}

/**
 * Mission Planner — decides WHICH mission the learner does today. It reads the Daily Goal,
 * the Review Queue load, User Progress, and the Learning Track, then returns the next
 * uncompleted mission in the track (in sort order) — unless reviews are heavy, in which case
 * it defers (`review_focus`) so the day is spent on review. Deterministic.
 */
export class MissionPlanner {
  constructor(private readonly missions: MissionRepository) {}

  async plan(context: MissionPlannerContext): Promise<MissionPlan> {
    if (context.reviewDueNow > MISSION_REVIEW_HEAVY_THRESHOLD) {
      return { mission: null, reason: 'review_focus' };
    }

    const completed = new Set(context.completedMissionIds);
    const missions = await this.missions.listByTrack(context.track.id);
    const next = missions
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .find((m) => !completed.has(m.id));

    if (!next) return { mission: null, reason: 'track_complete' };
    return { mission: next, reason: 'next_mission' };
  }
}
