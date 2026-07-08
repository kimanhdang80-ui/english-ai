import { describe, expect, it } from 'vitest';

import { InMemoryLessonPlanRepository } from '@/modules/daily-loop/infrastructure/in-memory-lesson-plan-repository';
import type {
  PlanDecision,
  ReviewSnapshot,
} from '@/modules/daily-loop/domain/planning';
import type {
  LearnerProfilePort,
  LessonPlannerAiPort,
  ReviewSnapshotPort,
} from '@/modules/daily-loop/application/ports';

import { LessonPlannerService } from './lesson-planner-service';

const clock = () => new Date('2026-07-02T00:00:00.000Z');

function reviews(snapshot: ReviewSnapshot): ReviewSnapshotPort {
  return { snapshot: async () => snapshot };
}
const profiles: LearnerProfilePort = {
  get: async () => ({ goal: 'general', cefr: 'A1', dailyMinutes: 15 }),
};

const AI_DECISION: PlanDecision = {
  strategy: 'balanced',
  newWordCount: 4,
  reviewCount: 2,
  quizCount: 4,
  difficulty: 'steady',
  activityKinds: ['vocabulary', 'dialogue', 'quiz', 'review'],
  decidedBy: 'ai',
  rationale: 'ai chose a gentle balanced set',
};

describe('LessonPlannerService', () => {
  it('uses the Rule Engine when no AI advisor is wired, and saves the plan', async () => {
    const repo = new InMemoryLessonPlanRepository();
    const svc = new LessonPlannerService(
      reviews({ dueNow: 0, total: 0, mastered: 0 }),
      profiles,
      repo,
      null,
      clock,
    );
    const plan = await svc.planForUser('u1');

    expect(plan.decidedBy).toBe('rule');
    expect(plan.strategy).toBe('new_mission');
    expect(plan.mission).not.toBeNull();
    expect(plan.date).toBe('2026-07-02');
    expect(await repo.latest('u1')).toEqual(plan);
  });

  it('uses the AI advisor decision when available', async () => {
    const ai: LessonPlannerAiPort = {
      configured: true,
      decide: async () => AI_DECISION,
    };
    const svc = new LessonPlannerService(
      reviews({ dueNow: 8, total: 20, mastered: 3 }),
      profiles,
      new InMemoryLessonPlanRepository(),
      ai,
      clock,
    );
    const plan = await svc.planForUser('u1');
    expect(plan.decidedBy).toBe('ai');
    expect(plan.completionCriteria.wordsToStudy).toBe(4);
  });

  it('falls back to the Rule Engine when the AI advisor throws', async () => {
    const ai: LessonPlannerAiPort = {
      configured: true,
      decide: async () => {
        throw new Error('provider down');
      },
    };
    const svc = new LessonPlannerService(
      reviews({ dueNow: 25, total: 40, mastered: 5 }),
      profiles,
      new InMemoryLessonPlanRepository(),
      ai,
      clock,
    );
    const plan = await svc.planForUser('u1');
    expect(plan.decidedBy).toBe('rule');
    expect(plan.strategy).toBe('review_focus');
  });

  it('falls back to the Rule Engine when the AI advisor declines (null)', async () => {
    const ai: LessonPlannerAiPort = {
      configured: true,
      decide: async () => null,
    };
    const svc = new LessonPlannerService(
      reviews({ dueNow: 10, total: 10, mastered: 0 }),
      profiles,
      new InMemoryLessonPlanRepository(),
      ai,
      clock,
    );
    const plan = await svc.planForUser('u1');
    expect(plan.decidedBy).toBe('rule');
    expect(plan.strategy).toBe('balanced');
  });
});
