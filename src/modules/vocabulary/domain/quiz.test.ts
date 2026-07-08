import { describe, expect, it } from 'vitest';

import { generateQuiz, type QuizItem } from './quiz';

function items(n: number): QuizItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    word: `word${i}`,
    definition: `definition ${i}`,
    exampleText: `This is word${i} in a sentence.`,
  }));
}

describe('generateQuiz — threshold (V-30, EC-17)', () => {
  it('returns [] when fewer than 4 usable items', () => {
    expect(generateQuiz(items(3))).toEqual([]);
  });

  it('ignores items without a definition', () => {
    const withEmpty: QuizItem[] = [
      { id: 'a', word: 'a', definition: '' },
      { id: 'b', word: 'b', definition: '' },
      { id: 'c', word: 'c', definition: '' },
      { id: 'd', word: 'd', definition: 'def d' },
    ];
    expect(generateQuiz(withEmpty)).toEqual([]);
  });
});

describe('generateQuiz — question kinds (FC-24)', () => {
  const qs = generateQuiz(items(8), 100);

  it('produces multiple choice with the correct answer at answerIndex', () => {
    const mc = qs.find((q) => q.kind === 'multiple_choice');
    expect(mc).toBeDefined();
    if (mc && mc.kind === 'multiple_choice') {
      expect(mc.options).toHaveLength(4);
      expect(mc.options[mc.answerIndex]).toBe('word0');
    }
  });

  it('produces a fill_blank with a blanked prompt and the word as answer', () => {
    const fb = qs.find((q) => q.kind === 'fill_blank');
    expect(fb).toBeDefined();
    if (fb && fb.kind === 'fill_blank') {
      expect(fb.prompt).toContain('_____');
      expect(fb.answer).toMatch(/^word\d$/);
    }
  });

  it('produces a true_false with a boolean answer', () => {
    const tf = qs.find((q) => q.kind === 'true_false');
    expect(tf).toBeDefined();
    if (tf && tf.kind === 'true_false') {
      expect(typeof tf.answer).toBe('boolean');
    }
  });

  it('produces a match question with 4 pairs', () => {
    const m = qs.find((q) => q.kind === 'match');
    expect(m).toBeDefined();
    if (m && m.kind === 'match') {
      expect(m.pairs).toHaveLength(4);
      expect(m.pairs[0]).toHaveProperty('left');
      expect(m.pairs[0]).toHaveProperty('right');
    }
  });
});

describe('generateQuiz — limit & determinism', () => {
  it('respects the limit', () => {
    expect(generateQuiz(items(20), 5)).toHaveLength(5);
  });

  it('is deterministic for the same input', () => {
    expect(generateQuiz(items(8), 10)).toEqual(generateQuiz(items(8), 10));
  });
});
