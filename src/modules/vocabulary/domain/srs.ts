import type { ReviewRating, VocabularyStatus } from './entities';

/**
 * Deterministic spaced-repetition scheduler (SM-2 lite). **No AI.**
 *
 * Pure function of (current state, rating, now) → next state. The clock is injected
 * so it is fully unit-testable with no time-dependent flakiness (CLAUDE.md §4).
 */

export interface SrsInput {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface SrsResult {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
  status: VocabularyStatus;
}

const MIN_EASE = 1.3;
const KNOWN_THRESHOLD_DAYS = 7;
const MASTERED_THRESHOLD_DAYS = 30;

function clampEase(ease: number): number {
  return Math.max(MIN_EASE, Number(ease.toFixed(2)));
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

function statusFor(intervalDays: number): VocabularyStatus {
  if (intervalDays >= MASTERED_THRESHOLD_DAYS) return 'mastered';
  if (intervalDays >= KNOWN_THRESHOLD_DAYS) return 'known';
  return 'learning';
}

export function schedule(
  state: SrsInput,
  rating: ReviewRating,
  now: Date,
): SrsResult {
  let { ease, intervalDays, repetitions } = state;
  const { lapses } = state;

  if (rating === 'again') {
    // Lapse — reset to same-day review, reduce ease.
    return {
      ease: clampEase(ease - 0.2),
      intervalDays: 0,
      repetitions: 0,
      lapses: lapses + 1,
      dueAt: now,
      status: 'learning',
    };
  }

  repetitions += 1;

  if (rating === 'hard') {
    ease = clampEase(ease - 0.15);
    intervalDays = Math.max(1, Math.round((intervalDays || 1) * 1.2));
  } else if (rating === 'good') {
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.max(1, Math.round(intervalDays * ease));
  } else {
    // easy
    ease = clampEase(ease + 0.15);
    if (repetitions === 1) intervalDays = 2;
    else
      intervalDays = Math.max(1, Math.round((intervalDays || 1) * ease * 1.3));
  }

  return {
    ease,
    intervalDays,
    repetitions,
    lapses,
    dueAt: addDays(now, intervalDays),
    status: statusFor(intervalDays),
  };
}
