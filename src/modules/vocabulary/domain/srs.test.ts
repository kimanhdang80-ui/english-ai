import { describe, expect, it } from 'vitest';

import { schedule, type SrsInput } from './srs';

const NOW = new Date('2026-07-01T00:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const fresh: SrsInput = {
  ease: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
};

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY);
}

describe('srs.schedule — good ratings (V-22, V-23, FC-12..FC-14)', () => {
  it('first good review → interval 1, rep 1, status learning, due +1d', () => {
    const r = schedule(fresh, 'good', NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.repetitions).toBe(1);
    expect(r.status).toBe('learning');
    expect(daysBetween(NOW, r.dueAt)).toBe(1);
    expect(r.ease).toBe(2.5);
  });

  it('second good review → interval 3, rep 2', () => {
    const r = schedule(
      { ease: 2.5, intervalDays: 1, repetitions: 1, lapses: 0 },
      'good',
      NOW,
    );
    expect(r.intervalDays).toBe(3);
    expect(r.repetitions).toBe(2);
  });

  it('third good review → round(interval*ease)=8, status known (≥7d)', () => {
    const r = schedule(
      { ease: 2.5, intervalDays: 3, repetitions: 2, lapses: 0 },
      'good',
      NOW,
    );
    expect(r.intervalDays).toBe(8);
    expect(r.status).toBe('known');
  });

  it('reaches mastered when interval ≥ 30d (FC-17)', () => {
    const r = schedule(
      { ease: 2.5, intervalDays: 20, repetitions: 5, lapses: 0 },
      'good',
      NOW,
    );
    expect(r.intervalDays).toBe(50);
    expect(r.status).toBe('mastered');
  });
});

describe('srs.schedule — again/lapse (V-21, FC-15, EC-14)', () => {
  it('resets interval to 0, reps to 0, increments lapses, lowers ease, due now', () => {
    const r = schedule(
      { ease: 2.5, intervalDays: 8, repetitions: 3, lapses: 0 },
      'again',
      NOW,
    );
    expect(r.intervalDays).toBe(0);
    expect(r.repetitions).toBe(0);
    expect(r.lapses).toBe(1);
    expect(r.ease).toBeCloseTo(2.3, 5);
    expect(r.status).toBe('learning');
    expect(r.dueAt.getTime()).toBe(NOW.getTime());
  });

  it('interval never goes negative (EC-14)', () => {
    const r = schedule(fresh, 'again', NOW);
    expect(r.intervalDays).toBeGreaterThanOrEqual(0);
  });
});

describe('srs.schedule — ease floor & bounds (V-19, V-20, EC-13)', () => {
  it('ease never drops below 1.3 after repeated lapses', () => {
    let state: SrsInput = { ...fresh, ease: 1.4 };
    for (let i = 0; i < 5; i++) {
      const r = schedule(state, 'again', NOW);
      expect(r.ease).toBeGreaterThanOrEqual(1.3);
      state = {
        ease: r.ease,
        intervalDays: r.intervalDays,
        repetitions: r.repetitions,
        lapses: r.lapses,
      };
    }
  });

  it('repetitions and lapses are never negative', () => {
    const r = schedule(fresh, 'good', NOW);
    expect(r.repetitions).toBeGreaterThanOrEqual(0);
    expect(r.lapses).toBeGreaterThanOrEqual(0);
  });
});

describe('srs.schedule — hard & easy', () => {
  it('hard lowers ease by 0.15 and grows interval modestly', () => {
    const r = schedule(
      { ease: 2.5, intervalDays: 5, repetitions: 2, lapses: 0 },
      'hard',
      NOW,
    );
    expect(r.ease).toBeCloseTo(2.35, 5);
    expect(r.intervalDays).toBe(6); // round(5 * 1.2)
    expect(r.repetitions).toBe(3);
  });

  it('easy raises ease and gives interval 2 on first rep', () => {
    const r = schedule(fresh, 'easy', NOW);
    expect(r.ease).toBeCloseTo(2.65, 5);
    expect(r.intervalDays).toBe(2);
  });
});

describe('srs.schedule — determinism (V-25)', () => {
  it('same (state, rating, now) yields identical result', () => {
    const a = schedule(fresh, 'good', NOW);
    const b = schedule(fresh, 'good', NOW);
    expect(a).toEqual(b);
  });
});
