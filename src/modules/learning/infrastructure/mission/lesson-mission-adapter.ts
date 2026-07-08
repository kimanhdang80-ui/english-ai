import type {
  Mission,
  MissionActivity,
} from '@/modules/learning/domain/mission/entities';

/**
 * Backward compatibility — "a Lesson wraps a Mission" (Task 03 requirement).
 *
 * The legacy `Lesson` (Course→Unit→Lesson) is left fully intact. Going forward a Lesson is a
 * thin wrapper over a Mission: this adapter renders a Mission into a lesson-shaped read view,
 * so existing lesson consumers can be fed from the Mission Engine without a rewrite. Pure.
 */
export interface LessonWrappingMission {
  id: string; // lesson id (mirrors the mission id in the wrapped model)
  missionId: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  activities: {
    id: string;
    type: MissionActivity['type'];
    title: string;
    available: boolean;
  }[];
}

export function wrapMissionAsLesson(mission: Mission): LessonWrappingMission {
  return {
    id: mission.id,
    missionId: mission.id,
    title: mission.title,
    summary: mission.learningGoal,
    estimatedMinutes: mission.estimatedMinutes,
    activities: mission.activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      available: a.available,
    })),
  };
}
