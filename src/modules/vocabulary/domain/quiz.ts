/**
 * Deterministic quiz generator (pure, **no AI**). Builds four question kinds from
 * seeded vocabulary. Deterministic (index-based distractors) → unit-testable.
 */

export interface QuizItem {
  id: string;
  word: string;
  definition: string;
  exampleText?: string | null;
}

export type QuizQuestion =
  | {
      id: string;
      kind: 'multiple_choice';
      prompt: string;
      options: string[];
      answerIndex: number;
    }
  | {
      id: string;
      kind: 'fill_blank';
      prompt: string;
      answer: string;
    }
  | {
      id: string;
      kind: 'match';
      instruction: string;
      pairs: { left: string; right: string }[];
    }
  | {
      id: string;
      kind: 'true_false';
      statement: string;
      answer: boolean;
    };

function distractors(
  items: QuizItem[],
  index: number,
  count: number,
): string[] {
  const out: string[] = [];
  for (let k = 1; out.length < count && k < items.length; k++) {
    const candidate = items[(index + k) % items.length];
    if (candidate && candidate.id !== items[index]!.id)
      out.push(candidate.word);
  }
  return out;
}

function blankExample(example: string, word: string): string | null {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  return re.test(example) ? example.replace(re, '_____') : null;
}

/** Generate up to `limit` mixed questions. Requires ≥ 4 items for MC/match. */
export function generateQuiz(items: QuizItem[], limit = 10): QuizQuestion[] {
  const usable = items.filter((i) => i.definition);
  if (usable.length < 4) return [];

  const questions: QuizQuestion[] = [];

  usable.forEach((item, i) => {
    const kind = i % 3;
    if (kind === 0) {
      const wrong = distractors(usable, i, 3);
      const options = [item.word, ...wrong];
      const answerIndex = i % options.length;
      // place the correct answer at a deterministic slot
      [options[0], options[answerIndex]] = [options[answerIndex]!, options[0]!];
      questions.push({
        id: `mc-${item.id}`,
        kind: 'multiple_choice',
        prompt: `Which word means: "${item.definition}"?`,
        options,
        answerIndex,
      });
    } else if (kind === 1) {
      const blanked = item.exampleText
        ? blankExample(item.exampleText, item.word)
        : null;
      if (blanked) {
        questions.push({
          id: `fb-${item.id}`,
          kind: 'fill_blank',
          prompt: blanked,
          answer: item.word,
        });
      } else {
        const wrong = distractors(usable, i, 3);
        const options = [item.word, ...wrong];
        questions.push({
          id: `mc-${item.id}`,
          kind: 'multiple_choice',
          prompt: `Which word means: "${item.definition}"?`,
          options,
          answerIndex: 0,
        });
      }
    } else {
      const other = usable[(i + 2) % usable.length]!;
      const useOwn = i % 2 === 0;
      questions.push({
        id: `tf-${item.id}`,
        kind: 'true_false',
        statement: `"${item.word}" means "${useOwn ? item.definition : other.definition}".`,
        answer: useOwn,
      });
    }
  });

  // Match questions in groups of 4.
  for (let g = 0; g + 4 <= usable.length; g += 4) {
    const group = usable.slice(g, g + 4);
    questions.push({
      id: `match-${g}`,
      kind: 'match',
      instruction: 'Match each word to its meaning.',
      pairs: group.map((it) => ({ left: it.word, right: it.definition })),
    });
  }

  return questions.slice(0, limit);
}
