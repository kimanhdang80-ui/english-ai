import { describe, expect, it } from 'vitest';

import { NotImplementedError } from '@/lib/errors';

import {
  ACTIVITY_BUILDERS,
  assertActivityImplemented,
  isSupportedActivity,
} from './activity-builders';

describe('activity builders (extension seam)', () => {
  it('supports vocabulary/dialogue/quiz/review', () => {
    for (const t of ['vocabulary', 'dialogue', 'quiz', 'review'] as const) {
      expect(isSupportedActivity(t)).toBe(true);
      expect(
        ACTIVITY_BUILDERS[t].build({ id: t, title: t, sortOrder: 0 }).available,
      ).toBe(true);
    }
  });

  it('treats listening/speaking as unavailable placeholders', () => {
    for (const t of ['listening', 'speaking'] as const) {
      expect(isSupportedActivity(t)).toBe(false);
      expect(
        ACTIVITY_BUILDERS[t].build({ id: t, title: t, sortOrder: 0 }).available,
      ).toBe(false);
    }
  });

  it('assertActivityImplemented throws NotImplementedError for placeholders', () => {
    expect(() => assertActivityImplemented('listening')).toThrow(
      NotImplementedError,
    );
    expect(() => assertActivityImplemented('vocabulary')).not.toThrow();
  });
});
