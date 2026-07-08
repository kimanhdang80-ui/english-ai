import type { PrismaClient } from '@prisma/client';

import type {
  LearnerProfileInfo,
  LearningGoalKind,
} from '@/modules/daily-loop/domain/planning';
import type { LearnerProfilePort } from '@/modules/daily-loop/application/ports';

const DEFAULTS: LearnerProfileInfo = {
  goal: 'general',
  cefr: 'A1',
  dailyMinutes: 15,
};

const GOALS: readonly LearningGoalKind[] = [
  'general',
  'conversation',
  'exam',
  'business',
  'kids',
];

function toGoal(value: string | null | undefined): LearningGoalKind {
  return GOALS.includes(value as LearningGoalKind)
    ? (value as LearningGoalKind)
    : DEFAULTS.goal;
}

/**
 * Reads the learner's goal / CEFR / daily-minutes from `profiles` for the planner.
 * Falls back to safe defaults when the profile row is missing (new learners) — no throw.
 */
export class PrismaLearnerProfileRepository implements LearnerProfilePort {
  constructor(private readonly prisma: PrismaClient) {}

  async get(userId: string): Promise<LearnerProfileInfo> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { learningGoal: true, currentCefr: true, dailyMinutesGoal: true },
    });
    if (!profile) return DEFAULTS;
    return {
      goal: toGoal(profile.learningGoal),
      cefr: profile.currentCefr?.trim() || DEFAULTS.cefr,
      dailyMinutes:
        profile.dailyMinutesGoal > 0
          ? profile.dailyMinutesGoal
          : DEFAULTS.dailyMinutes,
    };
  }
}
