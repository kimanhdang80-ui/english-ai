import {
  evaluateCompletion,
  type CompletionStatus,
} from '@/modules/learning/domain/mission/completion-rule';
import type {
  Mission,
  MissionProgress,
  MissionState,
} from '@/modules/learning/domain/mission/entities';

/**
 * Completion Service — evaluates a mission's CompletionRule against a learner's progress and
 * derives the mission lifecycle state. Thin wrapper over the pure `evaluateCompletion`.
 */
export class CompletionService {
  evaluate(mission: Mission, progress: MissionProgress): CompletionStatus {
    return evaluateCompletion(mission, progress);
  }

  /**
   * Derive lifecycle state (see MISSION_ENGINE.md):
   *   locked → available → in_progress → completed.
   * `unlocked` gates the locked→available transition (e.g. prior mission complete).
   */
  stateFor(
    mission: Mission,
    progress: MissionProgress | null,
    unlocked: boolean,
  ): MissionState {
    if (!unlocked) return 'locked';
    if (!progress || progress.completedActivityIds.length === 0)
      return 'available';
    return this.evaluate(mission, progress).isComplete
      ? 'completed'
      : 'in_progress';
  }
}
