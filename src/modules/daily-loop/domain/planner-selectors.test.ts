import { describe, expect, it } from 'vitest';

import {
  ActivitySelector,
  GoalSelector,
  MissionSelector,
} from './planner-selectors';
import type { DailyGoal, PlanDecision, ReviewSnapshot } from './planning';

describe('GoalSelector', () => {
  it('maps the profile goal + applies safe defaults for blank cefr/minutes', () => {
    const goal = new GoalSelector().select({
      goal: 'business',
      cefr: '',
      dailyMinutes: 0,
    });
    expect(goal.kind).toBe('business');
    expect(goal.label).toBe('Business English');
    expect(goal.cefr).toBe('A1');
    expect(goal.dailyMinutes).toBe(15);
  });
});

const goal: DailyGoal = {
  kind: 'general',
  label: 'Everyday English',
  dailyMinutes: 15,
  cefr: 'A1',
};

describe('MissionSelector', () => {
  const sel = new MissionSelector();

  it('derives a stable track id from goal + cefr', () => {
    expect(sel.track(goal).id).toBe('general-a1');
  });

  it('advances the set index from the learner’s existing word count', () => {
    const review: ReviewSnapshot = { dueNow: 0, total: 16, mastered: 0 };
    const mission = sel.select(goal, sel.track(goal), review, 8);
    expect(mission?.id).toBe('general-a1-set-3'); // floor(16/8)+1
    expect(mission?.newWordCount).toBe(8);
    expect(mission?.learningGoal).toContain('8');
  });

  it('returns null when there are no new words (review-focus day)', () => {
    const review: ReviewSnapshot = { dueNow: 30, total: 40, mastered: 0 };
    expect(sel.select(goal, sel.track(goal), review, 0)).toBeNull();
  });
});

describe('ActivitySelector', () => {
  const sel = new ActivitySelector();
  const decision: PlanDecision = {
    strategy: 'new_mission',
    newWordCount: 5,
    reviewCount: 3,
    quizCount: 5,
    difficulty: 'stretch',
    activityKinds: ['vocabulary', 'dialogue', 'quiz', 'review'],
    decidedBy: 'rule',
    rationale: 'test',
  };

  it('orders activities vocabulary → dialogue → quiz → review', () => {
    const acts = sel.select(decision, {
      id: 'm',
      trackId: 't',
      title: 'M',
      learningGoal: 'g',
      cefr: 'A1',
      newWordCount: 5,
      estimatedMinutes: 5,
    });
    expect(acts.map((a) => a.kind)).toEqual([
      'vocabulary',
      'dialogue',
      'quiz',
      'review',
    ]);
  });

  it('marks dialogue as planned-but-not-available (no fabricated content)', () => {
    const acts = sel.select(decision, {
      id: 'm',
      trackId: 't',
      title: 'M',
      learningGoal: 'g',
      cefr: 'A1',
      newWordCount: 5,
      estimatedMinutes: 5,
    });
    const dialogue = acts.find((a) => a.kind === 'dialogue');
    expect(dialogue?.available).toBe(false);
  });

  it('builds completion criteria from the decision counts', () => {
    const cc = sel.completionCriteria(decision);
    expect(cc.wordsToStudy).toBe(5);
    expect(cc.quizToAnswer).toBe(5);
    expect(cc.reviewsToClear).toBe(3);
    expect(cc.summary).toContain('study 5 words');
  });
});
