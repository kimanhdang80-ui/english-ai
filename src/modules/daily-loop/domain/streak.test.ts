import { describe, expect, it } from 'vitest';

import { computeStreak, shiftDay } from './streak';
import { toReviewQueueStatus } from './status-mapping';

describe('shiftDay', () => {
  it('shifts across month boundaries (UTC)', () => {
    expect(shiftDay('2026-07-01', -1)).toBe('2026-06-30');
    expect(shiftDay('2026-06-30', 1)).toBe('2026-07-01');
  });
});

describe('computeStreak', () => {
  it('returns zeros for no activity', () => {
    expect(computeStreak([], '2026-07-01')).toEqual({
      current: 0,
      longest: 0,
      lastActiveDate: null,
    });
  });

  it('counts a consecutive run ending today', () => {
    const days = ['2026-06-29', '2026-06-30', '2026-07-01'];
    const s = computeStreak(days, '2026-07-01');
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
    expect(s.lastActiveDate).toBe('2026-07-01');
  });

  it('keeps the streak on the grace day (active yesterday, not today)', () => {
    const days = ['2026-06-30', '2026-07-01'];
    expect(computeStreak(days, '2026-07-02').current).toBe(2);
  });

  it('breaks the current streak after a full missed day', () => {
    const days = ['2026-06-30', '2026-07-01'];
    expect(computeStreak(days, '2026-07-03').current).toBe(0);
  });

  it('finds the longest run despite gaps', () => {
    const days = ['2026-06-01', '2026-06-10', '2026-06-11', '2026-06-12'];
    expect(computeStreak(days, '2026-06-20').longest).toBe(3);
  });
});

describe('toReviewQueueStatus', () => {
  const now = '2026-07-01T00:00:00.000Z';
  it('mastered stays mastered', () => {
    expect(toReviewQueueStatus('mastered', now, now)).toBe('mastered');
  });
  it('due + not mastered → review', () => {
    expect(toReviewQueueStatus('learning', '2026-06-30T00:00:00Z', now)).toBe(
      'review',
    );
  });
  it('new + not due → new', () => {
    expect(toReviewQueueStatus('new', '2026-07-05T00:00:00Z', now)).toBe('new');
  });
  it('known + not due → learning', () => {
    expect(toReviewQueueStatus('known', '2026-07-05T00:00:00Z', now)).toBe(
      'learning',
    );
  });
});
