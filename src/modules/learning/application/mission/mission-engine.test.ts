import { describe, expect, it } from 'vitest';

import type {
  ActivityType,
  LearningTrack,
  Mission,
  MissionActivity,
} from '@/modules/learning/domain/mission/entities';
import { InMemoryMissionRepository } from '@/modules/learning/infrastructure/mission/in-memory-mission-repository';
import { InMemoryUserProgressRepository } from '@/modules/learning/infrastructure/mission/in-memory-user-progress';

import { ActivityPlanner } from './activity-planner';
import { MissionPlanner } from './mission-planner';
import { MissionService } from './mission-service';

const TRACK: LearningTrack = {
  id: 't1',
  title: 'Everyday English · A1',
  goal: 'general',
  cefr: 'A1',
};

function act(type: ActivityType, available = true): MissionActivity {
  return {
    id: `${type}-1`,
    type,
    title: type,
    sortOrder: 0,
    available,
    exercises: [],
  };
}

function mission(
  id: string,
  sortOrder: number,
  activities: MissionActivity[],
): Mission {
  return {
    id,
    trackId: 't1',
    title: `Mission ${id}`,
    learningGoal: 'goal',
    cefr: 'A1',
    difficulty: 'easy',
    estimatedMinutes: 10,
    activities,
    completionRule: { type: 'all_available_activities' },
    sortOrder,
  };
}

const goal = { kind: 'general', cefr: 'A1', dailyMinutes: 15 };

describe('MissionPlanner', () => {
  const repo = new InMemoryMissionRepository([
    mission('m0', 0, [act('vocabulary')]),
    mission('m1', 1, [act('vocabulary')]),
    mission('m2', 2, [act('vocabulary')]),
  ]);
  const planner = new MissionPlanner(repo);

  it('defers (review_focus) when reviews are heavy', async () => {
    const plan = await planner.plan({
      goal,
      reviewDueNow: 25,
      track: TRACK,
      completedMissionIds: [],
    });
    expect(plan.reason).toBe('review_focus');
    expect(plan.mission).toBeNull();
  });

  it('picks the next uncompleted mission in sort order', async () => {
    const plan = await planner.plan({
      goal,
      reviewDueNow: 5,
      track: TRACK,
      completedMissionIds: ['m0'],
    });
    expect(plan.reason).toBe('next_mission');
    expect(plan.mission?.id).toBe('m1');
  });

  it('reports track_complete when all missions are done', async () => {
    const plan = await planner.plan({
      goal,
      reviewDueNow: 0,
      track: TRACK,
      completedMissionIds: ['m0', 'm1', 'm2'],
    });
    expect(plan.reason).toBe('track_complete');
    expect(plan.mission).toBeNull();
  });
});

describe('ActivityPlanner', () => {
  const planner = new ActivityPlanner();

  it('orders activities canonically (vocabulary → quiz → review)', () => {
    const m = mission('m', 0, [act('quiz'), act('vocabulary'), act('review')]);
    expect(planner.order(m).map((a) => a.type)).toEqual([
      'vocabulary',
      'quiz',
      'review',
    ]);
  });

  it('reconciles placeholder availability and excludes it from runnable', () => {
    const m = mission('m', 0, [act('vocabulary'), act('listening', true)]);
    const ordered = planner.order(m);
    expect(ordered.find((a) => a.type === 'listening')?.available).toBe(false);
    expect(planner.runnable(m).map((a) => a.type)).toEqual(['vocabulary']);
  });
});

describe('MissionService', () => {
  function setup() {
    const repo = new InMemoryMissionRepository([
      mission('m0', 0, [act('vocabulary'), act('quiz')]),
      mission('m1', 1, [act('vocabulary')]),
    ]);
    const progress = new InMemoryUserProgressRepository();
    const service = new MissionService(
      repo,
      new MissionPlanner(repo),
      progress,
    );
    return { service, progress };
  }

  it('returns a mission view with state available when no progress', async () => {
    const { service } = setup();
    const view = await service.getForUser('u1', 'm0');
    expect(view?.state).toBe('available');
    expect(view?.activities.map((a) => a.type)).toEqual(['vocabulary', 'quiz']);
  });

  it('derives in_progress then completed from recorded progress', async () => {
    const { service, progress } = setup();
    await progress.record('u1', {
      missionId: 'm0',
      completedActivityIds: ['vocabulary-1'],
    });
    expect((await service.getForUser('u1', 'm0'))?.state).toBe('in_progress');

    await progress.record('u1', {
      missionId: 'm0',
      completedActivityIds: ['vocabulary-1', 'quiz-1'],
    });
    expect((await service.getForUser('u1', 'm0'))?.state).toBe('completed');
  });

  it('planNextForUser skips completed missions using progress', async () => {
    const { service, progress } = setup();
    await progress.record('u1', {
      missionId: 'm0',
      completedActivityIds: ['vocabulary-1', 'quiz-1'],
    });
    const plan = await service.planNextForUser({
      userId: 'u1',
      goal,
      reviewDueNow: 3,
      track: TRACK,
    });
    expect(plan.mission?.id).toBe('m1');
  });
});
