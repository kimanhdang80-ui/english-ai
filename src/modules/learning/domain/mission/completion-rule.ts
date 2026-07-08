import type { Mission, MissionProgress } from './entities';

/**
 * Pure completion evaluation. Kept separate from the entities so completion logic is
 * unit-testable without any infrastructure. The `CompletionService` (application) wraps this.
 */
export interface CompletionStatus {
  isComplete: boolean;
  completedActivities: number;
  totalActivities: number;
  /** Human-readable reason (why complete / what's left). */
  reason: string;
}

/** Activities that actually count toward completion (placeholders are excluded). */
function completableActivities(mission: Mission) {
  return mission.activities.filter((a) => a.available);
}

export function evaluateCompletion(
  mission: Mission,
  progress: MissionProgress,
): CompletionStatus {
  const completable = completableActivities(mission);
  const total = completable.length;
  const doneIds = new Set(progress.completedActivityIds);
  const done = completable.filter((a) => doneIds.has(a.id)).length;

  const activitiesDone = total > 0 && done >= total;

  if (mission.completionRule.type === 'min_quiz_score') {
    const required = mission.completionRule.minQuizScore ?? 0.8;
    const score = progress.quizScore ?? 0;
    const passed = score >= required;
    return {
      isComplete: activitiesDone && passed,
      completedActivities: done,
      totalActivities: total,
      reason: !activitiesDone
        ? `${done}/${total} activities done`
        : passed
          ? 'All activities done and quiz passed'
          : `Quiz score ${Math.round(score * 100)}% is below ${Math.round(required * 100)}%`,
    };
  }

  // default: all available activities completed
  return {
    isComplete: activitiesDone,
    completedActivities: done,
    totalActivities: total,
    reason: activitiesDone
      ? 'All activities completed'
      : `${done}/${total} activities done`,
  };
}
