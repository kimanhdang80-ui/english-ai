import { describe, expect, it } from 'vitest';

import { evaluateCompletion } from './completion-rule';
import type { CompletionRule, Mission, MissionActivity } from './entities';

function activity(id: string, available = true): MissionActivity {
  return {
    id,
    type: 'vocabulary',
    title: id,
    sortOrder: 0,
    available,
    exercises: [],
  };
}

function mission(
  activities: MissionActivity[],
  completionRule: CompletionRule = { type: 'all_available_activities' },
): Mission {
  return {
    id: 'm1',
    trackId: 't1',
    title: 'Mission',
    learningGoal: 'goal',
    cefr: 'A1',
    difficulty: 'easy',
    estimatedMinutes: 10,
    activities,
    completionRule,
    sortOrder: 0,
  };
}

describe('evaluateCompletion', () => {
  it('all_available_activities: incomplete until every available activity is done', () => {
    const m = mission([activity('a1'), activity('a2')]);
    const s = evaluateCompletion(m, {
      missionId: 'm1',
      completedActivityIds: ['a1'],
    });
    expect(s.isComplete).toBe(false);
    expect(s.completedActivities).toBe(1);
    expect(s.totalActivities).toBe(2);
  });

  it('all_available_activities: complete when all done', () => {
    const m = mission([activity('a1'), activity('a2')]);
    const s = evaluateCompletion(m, {
      missionId: 'm1',
      completedActivityIds: ['a1', 'a2'],
    });
    expect(s.isComplete).toBe(true);
  });

  it('excludes placeholder (unavailable) activities from completion', () => {
    const m = mission([activity('a1'), activity('a2'), activity('a3', false)]);
    const s = evaluateCompletion(m, {
      missionId: 'm1',
      completedActivityIds: ['a1', 'a2'],
    });
    expect(s.totalActivities).toBe(2); // a3 placeholder excluded
    expect(s.isComplete).toBe(true);
  });

  it('min_quiz_score: needs activities done AND the score threshold', () => {
    const m = mission([activity('a1')], {
      type: 'min_quiz_score',
      minQuizScore: 0.8,
    });
    const low = evaluateCompletion(m, {
      missionId: 'm1',
      completedActivityIds: ['a1'],
      quizScore: 0.6,
    });
    expect(low.isComplete).toBe(false);

    const high = evaluateCompletion(m, {
      missionId: 'm1',
      completedActivityIds: ['a1'],
      quizScore: 0.9,
    });
    expect(high.isComplete).toBe(true);
  });
});
