import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { missionContentToEngineMission } from '@/modules/learning/infrastructure/mission/mission-content-mapper';
import type { MissionContent } from '@/content/mission-schema';

/**
 * Offline invariants for RC-03 (Persistence Production Ready). The runtime persistence
 * (restart-server checks) needs a live DB, which this environment has none; these tests lock
 * the deliverables that CAN be verified offline: the migration creates every store, the
 * schema declares every model, and the Mission Library → engine mapper is faithful & pure.
 */

const MIGRATION = readFileSync(
  join(
    process.cwd(),
    'prisma',
    'migrations',
    '20260702010000_persistence_stores',
    'migration.sql',
  ),
  'utf8',
);

const SCHEMA = readFileSync(
  join(process.cwd(), 'prisma', 'schema.prisma'),
  'utf8',
);

const TABLES = [
  'learning_sessions',
  'lesson_plans',
  'content_tracks',
  'content_missions',
  'mission_progress',
  'prompt_templates',
  'prompt_versions',
  'ai_generation_jobs',
];

describe('RC-03 migration', () => {
  it.each(TABLES)('creates the %s table', (table) => {
    expect(MIGRATION).toContain(`CREATE TABLE "${table}"`);
  });

  it('wires cascade FKs to profiles for user-owned stores', () => {
    for (const table of [
      'learning_sessions',
      'lesson_plans',
      'mission_progress',
    ]) {
      expect(MIGRATION).toContain(`ALTER TABLE "${table}" ADD CONSTRAINT`);
    }
    expect(MIGRATION).toContain(
      'REFERENCES "profiles"("id") ON DELETE CASCADE',
    );
  });

  it('is additive only (no destructive statements)', () => {
    expect(MIGRATION).not.toMatch(/DROP TABLE/i);
    expect(MIGRATION).not.toMatch(/ALTER TABLE .* DROP COLUMN/i);
  });
});

describe('RC-03 schema models', () => {
  it.each([
    'model LearningSession',
    'model LessonPlanRecord',
    'model ContentTrack',
    'model ContentMission',
    'model MissionProgress',
    'model PromptTemplate',
    'model PromptVersion',
    'model AiGenerationJob',
  ])('declares %s', (decl) => {
    expect(SCHEMA).toContain(decl);
  });
});

describe('missionContentToEngineMission', () => {
  const content: MissionContent = {
    id: 'general-01',
    trackId: 'general',
    order: 1,
    title: 'Greetings',
    goal: 'Say hello and introduce yourself.',
    difficulty: 'easy',
    estimatedMinutes: 12,
    prerequisite: null,
    completionCriteria: {
      type: 'min_quiz_score',
      minQuizScore: 0.8,
      summary: 'Score at least 80% on the quiz.',
    },
    vocabulary: Array.from({ length: 8 }, (_, i) => ({
      word: `w${i}`,
      ipa: `/w${i}/`,
      meaning: `nghĩa ${i}`,
      example: `Example ${i}.`,
    })),
    dialogue: Array.from({ length: 8 }, (_, i) => ({
      speaker: i % 2 === 0 ? 'A' : 'B',
      line: `Line ${i}.`,
    })),
    exercises: {
      multipleChoice: Array.from({ length: 5 }, (_, i) => ({
        prompt: `MC ${i}?`,
        options: ['a', 'b', 'c', 'd'],
        answerIndex: 1,
        explanation: `because ${i}`,
      })),
      fillBlank: Array.from({ length: 3 }, (_, i) => ({
        prompt: `Fill ___ ${i}`,
        answer: `ans${i}`,
        hint: `hint ${i}`,
        explanation: `exp ${i}`,
      })),
      matching: Array.from({ length: 2 }, () => ({
        instruction: 'Match',
        pairs: [
          { left: 'hello', right: 'xin chào' },
          { left: 'bye', right: 'tạm biệt' },
          { left: 'yes', right: 'vâng' },
        ],
      })),
    },
    reviewFocus: ['w0', 'w1', 'w2', 'w3', 'w4'],
  };

  it('maps to an engine mission with ordered activities and quiz exercises', () => {
    const mission = missionContentToEngineMission(content, 'A1');

    expect(mission.id).toBe('general-01');
    expect(mission.trackId).toBe('general');
    expect(mission.cefr).toBe('A1');
    expect(mission.completionRule).toEqual({
      type: 'min_quiz_score',
      minQuizScore: 0.8,
    });

    const kinds = mission.activities.map((a) => a.type);
    expect(kinds).toEqual(['vocabulary', 'dialogue', 'quiz', 'review']);

    const quiz = mission.activities.find((a) => a.type === 'quiz')!;
    const byType = Object.fromEntries(
      quiz.exercises.map((e) => [e.type, e.questions.length]),
    );
    expect(byType.multiple_choice).toBe(5);
    expect(byType.fill_blank).toBe(3);
    expect(byType.match).toBe(6); // 2 matchings × 3 pairs

    const mc = quiz.exercises.find((e) => e.type === 'multiple_choice')!;
    expect(mc.questions[0]?.answers[0]?.value).toBe('b'); // options[answerIndex=1]
  });

  it('is pure (does not mutate the input)', () => {
    const snapshot = JSON.stringify(content);
    missionContentToEngineMission(content, 'A1');
    expect(JSON.stringify(content)).toBe(snapshot);
  });
});
