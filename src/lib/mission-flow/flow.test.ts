import { describe, expect, it } from 'vitest';

import { isCorrectArrangement, scramble, tokenize } from './arrange';
import { MISSION_PHASES, accuracyPct, nextPhase } from './flow';

describe('mission flow', () => {
  it('walks phases goal → … → summary and ends', () => {
    expect(MISSION_PHASES[0]).toBe('goal');
    expect(MISSION_PHASES[MISSION_PHASES.length - 1]).toBe('summary');
    expect(nextPhase('goal')).toBe('warmup');
    expect(nextPhase('quiz')).toBe('reflection');
    expect(nextPhase('summary')).toBeNull();
  });

  it('computes accuracy as a guarded percentage', () => {
    expect(accuracyPct(0, 0)).toBe(0);
    expect(accuracyPct(4, 5)).toBe(80);
    expect(accuracyPct(3, 3)).toBe(100);
  });
});

describe('arrange-sentence', () => {
  it('scrambles into a non-identity order (deterministically)', () => {
    const words = tokenize('I go to work every day');
    const a = scramble(words);
    const b = scramble(words);
    expect(a).toEqual(b); // deterministic
    expect(a.join(' ')).not.toBe(words.join(' ')); // not pre-solved
    expect([...a].sort()).toEqual([...words].sort()); // same multiset
  });

  it('leaves 1-word input unchanged', () => {
    expect(scramble(['hello'])).toEqual(['hello']);
  });

  it('accepts the correct ordering (punctuation-insensitive)', () => {
    const original = tokenize('Nice to meet you.');
    expect(isCorrectArrangement(['Nice', 'to', 'meet', 'you'], original)).toBe(
      true,
    );
    expect(isCorrectArrangement(['you', 'meet', 'to', 'Nice'], original)).toBe(
      false,
    );
  });
});
