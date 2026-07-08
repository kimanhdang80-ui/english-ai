/**
 * Arrange-sentence practice (Task 05) — pure helpers. The "arrange" exercise is DERIVED from
 * existing content (a dialogue line / example sentence) by scrambling its words; no new content
 * is authored and the Mission Library is unchanged. Deterministic (no randomness).
 */

export function tokenize(sentence: string): string[] {
  return sentence.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
}

/** Small deterministic string hash (stable ordering key). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministically scramble words into a non-identity order (so the exercise is never
 * pre-solved). Sentences with < 2 words are returned unchanged (nothing to arrange).
 */
export function scramble(words: string[]): string[] {
  if (words.length < 2) return [...words];
  const ordered = words
    .map((w, i) => ({ w, key: hash(`${w}#${i}`) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.w);
  if (ordered.join(' ') === words.join(' ')) {
    const [first, ...rest] = ordered;
    return [...rest, first as string];
  }
  return ordered;
}

function normalize(words: string[]): string {
  return words
    .join(' ')
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .trim();
}

/** True when the learner's ordering matches the original sentence (punctuation-insensitive). */
export function isCorrectArrangement(
  answer: string[],
  original: string[],
): boolean {
  return normalize(answer) === normalize(original);
}
