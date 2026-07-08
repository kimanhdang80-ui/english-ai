'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  isCorrectArrangement,
  scramble,
  tokenize,
} from '@/lib/mission-flow/arrange';
import type { MissionContent } from '@/content/mission-schema';

export interface StepResult {
  correct: number;
  total: number;
}

/** Feedback line shared by every practice/quiz item (announced to screen readers). */
function Feedback({ correct, text }: { correct: boolean; text: string }) {
  return (
    <p
      aria-live="polite"
      className={cn('text-sm', correct ? 'text-success' : 'text-destructive')}
    >
      {text}
    </p>
  );
}

function FillBlankQ({
  q,
  onAnswered,
}: {
  q: MissionContent['exercises']['fillBlank'][number];
  onAnswered: (correct: boolean) => void;
}) {
  const [value, setValue] = React.useState('');
  const [answered, setAnswered] = React.useState(false);
  const correct = value.trim().toLowerCase() === q.answer.toLowerCase();
  return (
    <div className="space-y-3">
      <p className="font-medium">{q.prompt}</p>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type the missing word"
        disabled={answered}
        aria-label="Your answer"
      />
      {!answered ? (
        <p className="text-xs text-muted-foreground">Hint: {q.hint}</p>
      ) : null}
      {answered ? (
        <Feedback
          correct={correct}
          text={correct ? 'Correct!' : `Answer: ${q.answer}`}
        />
      ) : (
        <Button
          size="sm"
          onClick={() => {
            setAnswered(true);
            onAnswered(correct);
          }}
        >
          Check
        </Button>
      )}
    </div>
  );
}

function ArrangeQ({
  sentence,
  onAnswered,
}: {
  sentence: string;
  onAnswered: (correct: boolean) => void;
}) {
  const words = React.useMemo(() => tokenize(sentence), [sentence]);
  const bank = React.useMemo(() => scramble(words), [words]);
  const [order, setOrder] = React.useState<number[]>([]);
  const [answered, setAnswered] = React.useState(false);
  const built = order.map((i) => bank[i]!);
  const correct = isCorrectArrangement(built, words);

  return (
    <div className="space-y-3">
      <p className="font-medium">Put the words in the correct order:</p>
      <div className="min-h-10 rounded-md border border-dashed p-2 text-sm">
        {built.length ? (
          built.join(' ')
        ) : (
          <span className="text-muted-foreground">Tap words below…</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {bank.map((w, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            disabled={answered || order.includes(i)}
            onClick={() => setOrder((o) => [...o, i])}
          >
            {w}
          </Button>
        ))}
      </div>
      {answered ? (
        <Feedback
          correct={correct}
          text={correct ? 'Correct!' : `Answer: ${words.join(' ')}`}
        />
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={order.length !== bank.length}
            onClick={() => {
              setAnswered(true);
              onAnswered(correct);
            }}
          >
            Check
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!order.length}
            onClick={() => setOrder([])}
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}

function MatchingQ({
  q,
  onAnswered,
}: {
  q: MissionContent['exercises']['matching'][number];
  onAnswered: (correct: boolean) => void;
}) {
  const rights = React.useMemo(() => q.pairs.map((p) => p.right), [q.pairs]);
  const [choices, setChoices] = React.useState<string[]>(() =>
    q.pairs.map(() => ''),
  );
  const [answered, setAnswered] = React.useState(false);
  const allCorrect = q.pairs.every((p, i) => choices[i] === p.right);

  return (
    <div className="space-y-3">
      <p className="font-medium">{q.instruction}</p>
      <div className="space-y-2">
        {q.pairs.map((p, i) => (
          <div key={p.left} className="flex items-center gap-3">
            <span className="w-28 shrink-0 font-medium">{p.left}</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={choices[i]}
              disabled={answered}
              aria-label={`Meaning of ${p.left}`}
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
                aria-hidden="true"
              >
                {choices[i] === p.right ? '✓' : '✕'}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {answered ? (
        <Feedback
          correct={allCorrect}
          text={allCorrect ? 'Correct!' : 'Check the correct matches above.'}
        />
      ) : (
        <Button
          size="sm"
          disabled={choices.some((c) => !c)}
          onClick={() => {
            setAnswered(true);
            onAnswered(allCorrect);
          }}
        >
          Check
        </Button>
      )}
    </div>
  );
}

function ChoiceQ({
  q,
  onAnswered,
}: {
  q: MissionContent['exercises']['multipleChoice'][number];
  onAnswered: (correct: boolean) => void;
}) {
  const [picked, setPicked] = React.useState<number | null>(null);
  const answered = picked !== null;
  return (
    <div className="space-y-3">
      <p className="font-medium">{q.prompt}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => (
          <Button
            key={i}
            variant="outline"
            disabled={answered}
            className={cn(
              'justify-start',
              answered && i === q.answerIndex && 'border-success text-success',
              answered &&
                picked === i &&
                i !== q.answerIndex &&
                'border-destructive text-destructive',
            )}
            onClick={() => {
              setPicked(i);
              onAnswered(i === q.answerIndex);
            }}
          >
            {opt}
          </Button>
        ))}
      </div>
      {answered ? (
        <Feedback
          correct={picked === q.answerIndex}
          text={
            picked === q.answerIndex
              ? 'Correct!'
              : `Answer: ${q.options[q.answerIndex]}`
          }
        />
      ) : null}
    </div>
  );
}

/** Generic single-question stepper used by Practice and Quiz. */
function Stepper({
  count,
  label,
  render,
  onComplete,
}: {
  count: number;
  label: string;
  render: (
    index: number,
    onAnswered: (correct: boolean) => void,
  ) => React.ReactNode;
  onComplete: (result: StepResult) => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [answered, setAnswered] = React.useState(false);

  function handleAnswered(isCorrect: boolean) {
    setAnswered(true);
    if (isCorrect) setCorrect((c) => c + 1);
  }
  function next() {
    if (index + 1 >= count) {
      onComplete({ correct, total: count });
      return;
    }
    setIndex((i) => i + 1);
    setAnswered(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {label} {index + 1} / {count}
      </p>
      {render(index, handleAnswered)}
      {answered ? (
        <Button className="w-full" onClick={next}>
          {index + 1 >= count ? 'Done' : 'Next'}
        </Button>
      ) : null}
    </div>
  );
}

/** Practice: fill-blank(s) → arrange(s) → matching(s), scored together. */
export function PracticeSession({
  mission,
  onComplete,
}: {
  mission: MissionContent;
  onComplete: (result: StepResult) => void;
}) {
  // Arrange sentences derived from short dialogue lines (3–9 words), up to 2.
  const arrangeSentences = React.useMemo(
    () =>
      mission.dialogue
        .map((d) => d.line)
        .filter((line) => {
          const n = tokenize(line).length;
          return n >= 3 && n <= 9;
        })
        .slice(0, 2),
    [mission.dialogue],
  );

  type Item =
    | { kind: 'fill'; i: number }
    | { kind: 'arrange'; i: number }
    | { kind: 'matching'; i: number };
  const items: Item[] = [
    ...mission.exercises.fillBlank.map((_, i) => ({
      kind: 'fill' as const,
      i,
    })),
    ...arrangeSentences.map((_, i) => ({ kind: 'arrange' as const, i })),
    ...mission.exercises.matching.map((_, i) => ({
      kind: 'matching' as const,
      i,
    })),
  ];

  return (
    <Stepper
      count={items.length}
      label="Practice"
      onComplete={onComplete}
      render={(index, onAnswered) => {
        const item = items[index]!;
        if (item.kind === 'fill')
          return (
            <FillBlankQ
              q={mission.exercises.fillBlank[item.i]!}
              onAnswered={onAnswered}
            />
          );
        if (item.kind === 'arrange')
          return (
            <ArrangeQ
              sentence={arrangeSentences[item.i]!}
              onAnswered={onAnswered}
            />
          );
        return (
          <MatchingQ
            q={mission.exercises.matching[item.i]!}
            onAnswered={onAnswered}
          />
        );
      }}
    />
  );
}

/** Quiz: the mission's multiple-choice questions, scored. */
export function MissionQuiz({
  mission,
  onComplete,
}: {
  mission: MissionContent;
  onComplete: (result: StepResult) => void;
}) {
  return (
    <Stepper
      count={mission.exercises.multipleChoice.length}
      label="Question"
      onComplete={onComplete}
      render={(index, onAnswered) => (
        <ChoiceQ
          q={mission.exercises.multipleChoice[index]!}
          onAnswered={onAnswered}
        />
      )}
    />
  );
}
