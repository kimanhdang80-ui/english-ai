'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  QuizSession,
  type QuizResultSummary,
} from '@/components/vocabulary/quiz-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiPost } from '@/lib/api-client';
import type { DailyLesson } from '@/modules/daily-loop/domain/entities';

/**
 * Runs the daily learning loop: study the words (flip + add to your set), then take the
 * quiz (results + explanations shown by QuizSession). A session summary (time + score) is
 * shown on completion. Quiz explanations come from the AI explanation port (real provider
 * when configured, deterministic fallback otherwise).
 */
export function DailyLessonPlayer({ lesson }: { lesson: DailyLesson }) {
  const [phase, setPhase] = React.useState<'study' | 'quiz'>('study');
  const [studyIndex, setStudyIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [added, setAdded] = React.useState<Record<string, boolean>>({});
  const startedAt = React.useRef<number>(Date.now());
  const [summary, setSummary] = React.useState<
    (QuizResultSummary & { durationMs: number }) | null
  >(null);

  const explanations = React.useMemo(
    () => Object.fromEntries(lesson.quiz.map((q) => [q.id, q.explanation])),
    [lesson.quiz],
  );

  if (lesson.words.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No lesson available yet — add some vocabulary to get started.
        </CardContent>
      </Card>
    );
  }

  async function addWord(vocabularyId: string) {
    setAdded((a) => ({ ...a, [vocabularyId]: true }));
    try {
      await apiPost('/api/v1/user-vocabulary', { vocabularyId });
    } catch {
      setAdded((a) => ({ ...a, [vocabularyId]: false }));
    }
  }

  const durationLabel = (ms: number) => {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const word = lesson.words[studyIndex]!;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Daily lesson · {lesson.date}</span>
        {summary ? (
          <span>
            Done in {durationLabel(summary.durationMs)} · {summary.score}/
            {summary.total}
          </span>
        ) : (
          <span>{phase === 'study' ? 'Study' : 'Quiz'}</span>
        )}
      </header>

      {phase === 'study' ? (
        <>
          <p className="text-xs text-muted-foreground">
            Word {studyIndex + 1} / {lesson.words.length}
          </p>
          <Card>
            <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 py-8 text-center">
              <h2 className="text-3xl font-bold">{word.word}</h2>
              {revealed ? (
                <div className="space-y-2 border-t pt-3">
                  <p className="font-medium">{word.definition}</p>
                  {word.example ? (
                    <p className="text-sm italic text-muted-foreground">
                      “{word.example}”
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {!revealed ? (
              <Button className="flex-1" onClick={() => setRevealed(true)}>
                Show meaning
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => addWord(word.vocabularyId)}
                  disabled={added[word.vocabularyId]}
                >
                  {added[word.vocabularyId] ? 'Added ✓' : 'Add to my words'}
                </Button>
                {studyIndex + 1 < lesson.words.length ? (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setStudyIndex((i) => i + 1);
                      setRevealed(false);
                    }}
                  >
                    Next word
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={() => setPhase('quiz')}>
                    Continue to quiz
                  </Button>
                )}
              </>
            )}
          </div>

          {revealed ? (
            <p className="text-xs text-muted-foreground">
              Tip: “Add to my words” saves this word to your review queue, so
              spaced repetition brings it back on the right day.
            </p>
          ) : null}
        </>
      ) : (
        <QuizSession
          questions={lesson.quiz}
          explanations={explanations}
          homeHref="/dashboard"
          homeLabel="Back to dashboard"
          onFinish={(s) =>
            setSummary({ ...s, durationMs: Date.now() - startedAt.current })
          }
        />
      )}

      {lesson.reviewWord ? (
        <p className="text-center text-xs text-muted-foreground">
          You also have a word due for review —{' '}
          <Link href="/review" className="text-primary hover:underline">
            go to Today&apos;s Review
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
