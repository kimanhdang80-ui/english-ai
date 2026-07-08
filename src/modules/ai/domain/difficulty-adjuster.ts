import type { DifficultyProfile } from '@/modules/ai/domain/entities';

/**
 * Maps a CEFR level to generation constraints (pure). Keeps difficulty policy in one
 * place so prompts/output budgets scale with the learner's level.
 */

const A1: DifficultyProfile = {
  level: 'A1',
  maxOutputTokens: 400,
  maxSentenceWords: 8,
  guidance: 'Very simple, high-frequency words; short sentences.',
};

const PROFILES: Record<string, DifficultyProfile> = {
  A1,
  A2: {
    level: 'A2',
    maxOutputTokens: 600,
    maxSentenceWords: 10,
    guidance: 'Simple everyday language; short, clear sentences.',
  },
  B1: {
    level: 'B1',
    maxOutputTokens: 800,
    maxSentenceWords: 14,
    guidance: 'Common vocabulary; some connected sentences.',
  },
  B2: {
    level: 'B2',
    maxOutputTokens: 1000,
    maxSentenceWords: 18,
    guidance: 'Broader vocabulary; more complex structures.',
  },
  C1: {
    level: 'C1',
    maxOutputTokens: 1200,
    maxSentenceWords: 22,
    guidance: 'Rich vocabulary; nuanced, idiomatic language.',
  },
  C2: {
    level: 'C2',
    maxOutputTokens: 1500,
    maxSentenceWords: 26,
    guidance: 'Native-like range; sophisticated structures.',
  },
};

export class DifficultyAdjuster {
  profileFor(level: string): DifficultyProfile {
    return PROFILES[level.toUpperCase()] ?? A1;
  }
}
