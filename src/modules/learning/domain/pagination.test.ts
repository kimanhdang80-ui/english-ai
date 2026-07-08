import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  toPage,
  toPageQuery,
  toSkipTake,
} from './pagination';

describe('toPageQuery — clamping (V-01, V-02, EC-10, EC-11)', () => {
  it('defaults to page 1 and default page size', () => {
    expect(toPageQuery({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('coerces page < 1 (0, negative) to 1', () => {
    expect(toPageQuery({ page: 0 }).page).toBe(1);
    expect(toPageQuery({ page: -5 }).page).toBe(1);
  });

  it('clamps pageSize above the max', () => {
    expect(toPageQuery({ pageSize: 100000 }).pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('clamps a negative pageSize to 1', () => {
    expect(toPageQuery({ pageSize: -3 }).pageSize).toBe(1);
  });

  // NOTE: pageSize = 0 is falsy → treated as "absent" → default (not clamp-to-1).
  // Spec V-02 is ambiguous on 0; see reports/spec-review.md (SR-04).
  it('treats pageSize 0 as absent → default', () => {
    expect(toPageQuery({ pageSize: 0 }).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it('accepts numeric strings', () => {
    expect(toPageQuery({ page: '3', pageSize: '10' })).toEqual({
      page: 3,
      pageSize: 10,
    });
  });
});

describe('toSkipTake', () => {
  it('computes skip/take from page & size', () => {
    expect(toSkipTake({ page: 3, pageSize: 20 })).toEqual({
      skip: 40,
      take: 20,
    });
    expect(toSkipTake({ page: 1, pageSize: 24 })).toEqual({
      skip: 0,
      take: 24,
    });
  });
});

describe('toPage', () => {
  it('wraps items with paging metadata', () => {
    const page = toPage([1, 2, 3], 57, { page: 2, pageSize: 3 });
    expect(page).toEqual({ items: [1, 2, 3], total: 57, page: 2, pageSize: 3 });
  });
});
