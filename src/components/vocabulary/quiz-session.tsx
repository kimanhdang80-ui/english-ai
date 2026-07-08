'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/modules/vocabulary/domain/quiz';

/**
 * Client quiz over generated questions (Multiple Choice, Fill in the Blank,
 * Match Word, True/False). Grading is on the client against the generated key.
 * The completion screen reports the score and reviews wrong answers (with the
 * correct answer + an optional explanation).
 */
export interface QuizResultSummary {
  score: number;
  total: number;
}

interface AnswerResult {
  label: string;
  correct: boolean;
  correctText: string;
  explanation?: string;
}

/** Beginner-friendly names for each question type (raw enum reads awkwardly). */
const KIND_LABEL: Record<QuizQuestion['kind'], string> = {
  multiple_choice: 'Multiple choice',
  fill_blank: 'Fill in the blank',
  true_false: 'True or false',
  match: 'Match the words',
};

export function QuizSession({
  questions,
  explanations,
  onFinish,
  homeHref = '/vocabulary',
  homeLabel = 'Back to words',
}: {
  questions: QuizQuestion[];
  explanations?: Record<string, string>;
  onFinish?: (summary: QuizResultSummary) => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const [answered, setAnswered] = React.useState(false);
  const [results, setResults] = React.useState<AnswerResult[]>([]);
  const finished = React.useRef(false);

  const score = results.filter((r) => r.correct).length;
  const done = index >= questions.length && questions.length > 0;

  React.useEffect(() => {
    if (done && !finished.current) {
      finished.current = true;
      onFinish?.({ score, total: questions.length });
    }
  }, [done, onFinish, score, questions.length]);

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">
            Not enough words to build a quiz yet.
          </p>
          <Button asChild variant="outline">
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    const wrong = results.filter((r) => !r.correct);
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-lg font-semibold">Quiz complete 🎉</p>
            <p className="text-sm text-muted-foreground">
              Score: {score} / {questions.length}
            </p>
          </CardContent>
        </Card>

        {wrong.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review your answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wrong.map((r, i) => (
                <div
                  key={i}
                  className="border-t pt-3 first:border-t-0 first:pt-0"
                >
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-sm text-success">
                    Answer: {r.correctText}
                  </p>
                  {r.explanation ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Why: </span>
                      {r.explanation}
                    </p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Button asChild className="w-full">
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    );
  }

  const q = questions[index]!;

  function record(correct: boolean, correctText: string, label: string) {
    if (answered) return;
    setAnswered(true);
    setResults((prev) => [
      ...prev,
      { label, correct, correctText, explanation: explanations?.[q.id] },
    ]);
  }

  function next() {
    setAnswered(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span>Score: {score}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{KIND_LABEL[q.kind]}</CardTitle>
        </CardHeader>
        <CardContent>
          {q.kind === 'multiple_choice' ? (
            <MultipleChoice q={q} answered={answered} onResult={record} />
          ) : q.kind === 'fill_blank' ? (
            <FillBlank q={q} answered={answered} onResult={record} />
          ) : q.kind === 'true_false' ? (
            <TrueFalse q={q} answered={answered} onResult={record} />
          ) : (
            <MatchWord q={q} answered={answered} onResult={record} />
          )}
        </CardContent>
      </Card>

      {answered ? (
        <Button className="w-full" onClick={next}>
          {index + 1 === questions.length ? 'Finish' : 'Next'}
        </Button>
      ) : null}
    </div>
  );
}

type RecordFn = (correct: boolean, correctText: string, label: string) => void;

function MultipleChoice({
  q,
  answered,
  onResult,
}: {
  q: Extract<QuizQuestion, { kind: 'multiple_choice' }>;
  answered: boolean;
  onResult: RecordFn;
}) {
  const [picked, setPicked] = React.useState<number | null>(null);
  const correctText = q.options[q.answerIndex] ?? '';
  return (
    <div className="space-y-3">
      <p className="font-medium">{q.prompt}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answerIndex;
          const isPicked = i === picked;
          return (
            <Button
              key={i}
              variant="outline"
              disabled={answered}
              className={cn(
                'justify-start',
                answered && isAnswer && 'border-success text-success',
                answered &&
                  isPicked &&
                  !isAnswer &&
                  'border-destructive text-destructive',
              )}
              onClick={() => {
                setPicked(i);
                onResult(i === q.answerIndex, correctText, q.prompt);
              }}
            >
              {opt}
            </Button>
          );
        })}
      </div>
      {answered ? (
        <p
          aria-live="polite"
          className={cn(
            'text-sm',
            picked === q.answerIndex ? 'text-success' : 'text-destructive',
          )}
        >
          {picked === q.answerIndex ? 'Correct!' : `Answer: ${correctText}`}
        </p>
      ) : null}
    </div>
  );
}

function FillBlank({
  q,
  answered,
  onResult,
}: {
  q: Extract<QuizQuestion, { kind: 'fill_blank' }>;
  answered: boolean;
  onResult: RecordFn;
}) {
  const [value, setValue] = React.useState('');
  const correct = value.trim().toLowerCase() === q.answer.toLowerCase();
  return (
    <div className="space-y-3">
      <p className="font-medium">{q.prompt}</p>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type the missing word"
        disabled={answered}
      />
      {answered ? (
        <p
          aria-live="polite"
          className={cn(
            'text-sm',
            correct ? 'text-success' : 'text-destructive',
          )}
        >
          {correct ? 'Correct!' : `Answer: ${q.answer}`}
        </p>
      ) : (
        <Button size="sm" onClick={() => onResult(correct, q.answer, q.prompt)}>
          Check
        </Button>
      )}
    </div>
  );
}

function TrueFalse({
  q,
  answered,
  onResult,
}: {
  q: Extract<QuizQuestion, { kind: 'true_false' }>;
  answered: boolean;
  onResult: RecordFn;
}) {
  const [picked, setPicked] = React.useState<boolean | null>(null);
  const correctText = q.answer ? 'True' : 'False';
  return (
    <div className="space-y-3">
      <p className="font-medium">{q.statement}</p>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((val) => (
          <Button
            key={String(val)}
            variant="outline"
            disabled={answered}
            className={cn(
              answered && val === q.answer && 'border-success text-success',
              answered &&
                picked === val &&
                val !== q.answer &&
                'border-destructive text-destructive',
            )}
            onClick={() => {
              setPicked(val);
              onResult(val === q.answer, correctText, q.statement);
            }}
          >
            {val ? 'True' : 'False'}
          </Button>
        ))}
      </div>
      {answered ? (
        <p
          aria-live="polite"
          className={cn(
            'text-sm',
            picked === q.answer ? 'text-success' : 'text-destructive',
          )}
        >
          {picked === q.answer ? 'Correct!' : `Answer: ${correctText}`}
        </p>
      ) : null}
    </div>
  );
}

function MatchWord({
  q,
  answered,
  onResult,
}: {
  q: Extract<QuizQuestion, { kind: 'match' }>;
  answered: boolean;
  onResult: RecordFn;
}) {
  // Deterministically rotate the right-hand options so they aren't pre-aligned.
  const rights = q.pairs.map(
    (_, i) => q.pairs[(i + 1) % q.pairs.length]!.right,
  );
  const [choices, setChoices] = React.useState<string[]>(() =>
    q.pairs.map(() => ''),
  );
  const correctText = q.pairs.map((p) => `${p.left} → ${p.right}`).join('; ');
  const allCorrect = q.pairs.every((p, i) => choices[i] === p.right);

  function check() {
    onResult(allCorrect, correctText, q.instruction);
  }

  return (
    <div className="space-y-3">
      <p className="font-medium">{q.instruction}</p>
      <div className="space-y-2">
        {q.pairs.map((p, i) => (
          <div key={p.left} className="flex items-center gap-3">
            <span className="w-24 shrink-0 font-medium">{p.left}</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={choices[i]}
              disabled={answered}
              onChange={(e) => {
                const next = [...choices];
                next[i] = e.target.value;
                setChoices(next);
              }}
            >
              <option value="">— choose —</option>
              {rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {answered ? (
              <span
                className={
                  choices[i] === p.right ? 'text-success' : 'text-destructive'
                }
              >
                {choices[i] === p.right ? '✓' : '✕'}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {answered ? (
        <p
          aria-live="polite"
          className={cn(
            'text-sm',
            allCorrect ? 'text-success' : 'text-destructive',
          )}
        >
          {allCorrect ? 'Correct!' : 'Check the correct matches above.'}
        </p>
      ) : (
        <Button size="sm" onClick={check}>
          Check
        </Button>
      )}
    </div>
  );
}
