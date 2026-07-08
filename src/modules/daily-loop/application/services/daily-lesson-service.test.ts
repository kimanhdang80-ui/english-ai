import { describe, expect, it } from 'vitest';

import type { ReviewCard } from '@/modules/vocabulary/domain/entities';
import type { QuizItem } from '@/modules/vocabulary/domain/quiz';
import type { ReviewSnapshot } from '@/modules/daily-loop/domain/planning';

import { MockExplanationAdapter } from '@/modules/daily-loop/infrastructure/mock-explanation-adapter';
import { InMemoryLessonPlanRepository } from '@/modules/daily-loop/infrastructure/in-memory-lesson-plan-repository';
import type {
  LearnerProfilePort,
  LessonSourcePort,
  ReviewSnapshotPort,
} from '@/modules/daily-loop/application/ports';

import { DailyLessonService } from './daily-lesson-service';
import { LessonPlannerService } from './lesson-planner-service';

function items(n: number): QuizItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w${i}`,
    word: `word${i}`,
    definition: `meaning ${i}`,
    exampleText: `This is word${i} here.`,
  }));
}

function reviewCard(word: string): ReviewCard {
  return {
    vocabulary: {
      id: `v-${word}`,
      word,
      slug: word,
      lemma: null,
      cefrLevelId: null,
      frequencyRank: 1,
      meanings: [
        {
          id: 'm1',
          partOfSpeech: 'noun',
          definition: `${word} means x`,
          translation: null,
        },
      ],
      examples: [
        { id: 'e1', meaningId: null, text: `An ${word}.`, translation: null },
      ],
      pronunciations: [],
      audios: [],
      images: [],
      tags: [],
    },
    state: {
      id: `uv-${word}`,
      vocabularyId: `v-${word}`,
      status: 'learning',
      isFavorite: false,
      ease: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: '2026-07-01T00:00:00.000Z',
      lastReviewedAt: null,
    },
  };
}

function makeSource(over: Partial<LessonSourcePort> = {}): LessonSourcePort {
  return {
    quizItems: async (limit: number) => items(limit),
    dueReview: async () => null,
    studySet: async () => [] as ReviewCard[],
    ...over,
  };
}

const clock = () => new Date('2026-07-02T00:00:00.000Z');

function makePlanner(snapshot: ReviewSnapshot): LessonPlannerService {
  const reviews: ReviewSnapshotPort = { snapshot: async () => snapshot };
  const profiles: LearnerProfilePort = {
    get: async () => ({ goal: 'general', cefr: 'A1', dailyMinutes: 15 }),
  };
  return new LessonPlannerService(
    reviews,
    profiles,
    new InMemoryLessonPlanRepository(),
    null,
    clock,
  );
}

describe('DailyLessonService.buildForUser (plan-driven)', () => {
  it('new learner (0 due) → new-mission words + quiz with explanations + attached plan', async () => {
    const source = makeSource();
    const svc = new DailyLessonService(
      makePlanner({ dueNow: 0, total: 0, mastered: 0 }),
      source,
      new MockExplanationAdapter(),
    );
    const lesson = await svc.buildForUser('user1');

    expect(lesson.date).toBe('2026-07-02');
    expect(lesson.plan?.strategy).toBe('new_mission');
    // new-mission words come from the corpus (count decided by the rule engine)
    expect(lesson.words.length).toBe(
      lesson.plan?.completionCriteria.wordsToStudy,
    );
    expect(lesson.words.length).toBeGreaterThan(0);
    expect(lesson.quiz.length).toBeGreaterThan(0);
    expect(lesson.quiz.every((q) => q.explanation.length > 0)).toBe(true);
    expect(lesson.quiz.some((q) => q.explanation.includes('word'))).toBe(true);
  });

  it('review-focus day (many due) → 0 new words, study cards sourced from the review set', async () => {
    const studyCards = [
      reviewCard('apple'),
      reviewCard('book'),
      reviewCard('cat'),
    ];
    const source = makeSource({ studySet: async () => studyCards });
    const svc = new DailyLessonService(
      makePlanner({ dueNow: 25, total: 40, mastered: 5 }),
      source,
      new MockExplanationAdapter(),
    );
    const lesson = await svc.buildForUser('user1');

    expect(lesson.plan?.strategy).toBe('review_focus');
    expect(lesson.plan?.completionCriteria.wordsToStudy).toBe(0);
    // player still has content — materialized from the real due review set (no mock)
    expect(lesson.words.length).toBeGreaterThan(0);
    expect(lesson.words.map((w) => w.word)).toContain('apple');
  });

  it('includes a due review word when one exists', async () => {
    const source = makeSource({ dueReview: async () => reviewCard('apple') });
    const svc = new DailyLessonService(
      makePlanner({ dueNow: 8, total: 8, mastered: 0 }),
      source,
      new MockExplanationAdapter(),
    );
    const lesson = await svc.buildForUser('user1');
    expect(lesson.plan?.strategy).toBe('balanced');
    expect(lesson.reviewWord?.word).toBe('apple');
    expect(lesson.reviewUserVocabularyId).toBe('uv-apple');
  });
});
