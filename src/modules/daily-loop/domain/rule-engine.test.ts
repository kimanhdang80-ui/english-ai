import { describe, expect, it } from 'vitest';

import type { DailyGoal, ReviewSnapshot } from './planning';
import { PLANNER_RULES, RuleEngine } from './rule-engine';

const engine = new RuleEngine();

function goal(dailyMinutes = 15): DailyGoal {
  return {
    kind: 'general',
    label: 'Everyday English',
    dailyMinutes,
    cefr: 'A1',
  };
}
const snap = (dueNow: number): ReviewSnapshot => ({
  dueNow,
  total: dueNow,
  mastered: 0,
});

describe('RuleEngine.decide', () => {
  it('review-heavy (> 20 due) → review_focus, no new words', () => {
    const d = engine.decide({ review: snap(25), goal: goal() });
    expect(d.strategy).toBe('review_focus');
    expect(d.newWordCount).toBe(0);
    expect(d.reviewCount).toBe(PLANNER_RULES.REVIEW_CAP_FOCUS);
    expect(d.difficulty).toBe('consolidate');
    expect(d.activityKinds).toEqual(['quiz', 'review']);
    expect(d.decidedBy).toBe('rule');
  });

  it('review-light (< 5 due) → new_mission with new words', () => {
    const d = engine.decide({ review: snap(3), goal: goal() });
    expect(d.strategy).toBe('new_mission');
    expect(d.newWordCount).toBe(PLANNER_RULES.NEW_WORDS_NEW_MISSION);
    expect(d.reviewCount).toBe(3);
    expect(d.difficulty).toBe('stretch');
    expect(d.activityKinds).toEqual([
      'vocabulary',
      'dialogue',
      'quiz',
      'review',
    ]);
  });

  it('mid-range due → balanced', () => {
    const d = engine.decide({ review: snap(10), goal: goal() });
    expect(d.strategy).toBe('balanced');
    expect(d.newWordCount).toBe(PLANNER_RULES.NEW_WORDS_BALANCED);
    expect(d.reviewCount).toBe(10);
    expect(d.difficulty).toBe('steady');
  });

  it('boundary: exactly the heavy threshold is NOT review_focus', () => {
    const d = engine.decide({
      review: snap(PLANNER_RULES.REVIEW_HEAVY_THRESHOLD),
      goal: goal(),
    });
    expect(d.strategy).toBe('balanced');
  });

  it('time-boxes to a small daily budget by trimming new words', () => {
    const d = engine.decide({ review: snap(3), goal: goal(5) });
    expect(d.newWordCount).toBeLessThan(PLANNER_RULES.NEW_WORDS_NEW_MISSION);
    expect(d.decidedBy).toBe('rule');
  });

  it('is deterministic (same input → same output)', () => {
    const a = engine.decide({ review: snap(10), goal: goal() });
    const b = engine.decide({ review: snap(10), goal: goal() });
    expect(a).toEqual(b);
  });
});
