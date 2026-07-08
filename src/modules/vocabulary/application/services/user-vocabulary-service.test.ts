import { describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/lib/errors';
import type {
  UserVocabularyRecord,
  UserVocabularyRepository,
} from '@/modules/vocabulary/application/ports';

import { UserVocabularyService } from './user-vocabulary-service';

const CLOCK = () => new Date('2026-07-01T00:00:00.000Z');

function makeRecord(
  over: Partial<UserVocabularyRecord> = {},
): UserVocabularyRecord {
  return {
    id: 'uv1',
    vocabularyId: 'v1',
    status: 'new',
    isFavorite: false,
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: '2026-07-01T00:00:00.000Z',
    lastReviewedAt: null,
    ...over,
  };
}

function makeRepo(
  over: Partial<UserVocabularyRepository> = {},
): UserVocabularyRepository {
  return {
    findByUserAndVocabulary: vi.fn(
      async (_userId: string, _vocabularyId: string) => null,
    ),
    create: vi.fn(async (_userId: string, vocabularyId: string) =>
      makeRecord({ vocabularyId }),
    ),
    findForUser: vi.fn(async (_id: string, _userId: string) => null),
    setFavorite: vi.fn(
      async (id: string, _userId: string, isFavorite: boolean) =>
        makeRecord({ id, isFavorite }),
    ),
    recordReview: vi.fn(
      async (p: Parameters<UserVocabularyRepository['recordReview']>[0]) =>
        makeRecord({
          id: p.id,
          intervalDays: p.result.intervalDays,
          ease: p.result.ease,
          repetitions: p.result.repetitions,
          lapses: p.result.lapses,
          status: p.result.status,
          dueAt: p.result.dueAt.toISOString(),
          lastReviewedAt: p.now.toISOString(),
        }),
    ),
    listDue: vi.fn(async () => []),
    listStudySet: vi.fn(async () => []),
    stats: vi.fn(async () => ({
      totalWords: 0,
      studying: 0,
      learned: 0,
      dueToday: 0,
      completionRate: 0,
    })),
    ...over,
  };
}

describe('addToLearning — idempotency (V-14, FC-08/FC-09)', () => {
  it('creates a new entry when none exists', async () => {
    const repo = makeRepo();
    const svc = new UserVocabularyService(repo, CLOCK);
    const state = await svc.addToLearning('user1', 'v1');
    expect(repo.create).toHaveBeenCalledOnce();
    expect(state.vocabularyId).toBe('v1');
  });

  it('returns the existing entry without creating a duplicate', async () => {
    const repo = makeRepo({
      findByUserAndVocabulary: vi.fn(async () =>
        makeRecord({ id: 'existing' }),
      ),
    });
    const svc = new UserVocabularyService(repo, CLOCK);
    const state = await svc.addToLearning('user1', 'v1');
    expect(repo.create).not.toHaveBeenCalled();
    expect(state.id).toBe('existing');
  });
});

describe('review — SRS application (FC-12) and ownership (V-18, EC-04)', () => {
  it('applies a good rating and returns the rescheduled state', async () => {
    const repo = makeRepo({
      findForUser: vi.fn(async () => makeRecord()),
    });
    const svc = new UserVocabularyService(repo, CLOCK);
    const state = await svc.review('user1', 'uv1', 'good');
    // fresh + good → interval 1
    expect(state.intervalDays).toBe(1);
    expect(repo.recordReview).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 'good',
        prevIntervalDays: 0,
        prevEase: 2.5,
      }),
    );
  });

  it('throws NotFoundError when the entry is not the user’s / missing', async () => {
    const repo = makeRepo({ findForUser: vi.fn(async () => null) });
    const svc = new UserVocabularyService(repo, CLOCK);
    await expect(svc.review('user1', 'nope', 'good')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.recordReview).not.toHaveBeenCalled();
  });
});

describe('setFavorite — ownership (V-12)', () => {
  it('sets favorite on an owned entry', async () => {
    const repo = makeRepo({ findForUser: vi.fn(async () => makeRecord()) });
    const svc = new UserVocabularyService(repo, CLOCK);
    const state = await svc.setFavorite('user1', 'uv1', true);
    expect(state.isFavorite).toBe(true);
  });

  it('throws NotFoundError for a missing entry', async () => {
    const repo = makeRepo({ findForUser: vi.fn(async () => null) });
    const svc = new UserVocabularyService(repo, CLOCK);
    await expect(
      svc.setFavorite('user1', 'missing', true),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('getStats — passthrough (FC-29)', () => {
  it('returns the repository stats', async () => {
    const repo = makeRepo({
      stats: vi.fn(async () => ({
        totalWords: 100,
        studying: 10,
        learned: 4,
        dueToday: 2,
        completionRate: 0.04,
      })),
    });
    const svc = new UserVocabularyService(repo, CLOCK);
    const stats = await svc.getStats('user1');
    expect(stats.totalWords).toBe(100);
    expect(stats.completionRate).toBeCloseTo(0.04, 5);
  });
});
