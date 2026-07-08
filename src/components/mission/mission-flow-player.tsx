'use client';

import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  accuracyPct,
  durationLabel,
  nextPhase,
  type MissionPhase,
} from '@/lib/mission-flow/flow';
import type { MissionContent } from '@/content/mission-schema';

import {
  MissionQuiz,
  PracticeSession,
  type StepResult,
} from './mission-practice';

/**
 * The complete mission learning flow (Task 05):
 * Goal → Warmup → Vocabulary → Dialogue → Practice → Quiz → Reflection → Summary → (Review Queue).
 *
 * Runs entirely over the authored mission content (no engine/DB/library change). Scoring, the
 * review-queue update, and the summary are computed for the session; persisting to the global SRS
 * needs the library seeded into the DB (Learning Model V2 migration) — see MISSION_FLOW.md.
 */
export function MissionFlowPlayer({
  mission,
  nextTitle,
  homeHref = '/dashboard',
}: {
  mission: MissionContent;
  nextTitle: string | null;
  homeHref?: string;
}) {
  const [phase, setPhase] = React.useState<MissionPhase>('goal');
  const startedAt = React.useRef<number>(Date.now());
  const [scores, setScores] = React.useState<StepResult[]>([]);
  const [reflection, setReflection] = React.useState<{
    hardest?: string;
    confidence?: string;
  }>({});
  const [durationMs, setDurationMs] = React.useState(0);

  const advance = () => setPhase((p) => nextPhase(p) ?? 'summary');
  const recordStep = (r: StepResult) => {
    setScores((s) => [...s, r]);
    advance();
  };

  const totals = scores.reduce(
    (acc, s) => ({
      correct: acc.correct + s.correct,
      total: acc.total + s.total,
    }),
    { correct: 0, total: 0 },
  );
  const accuracy = accuracyPct(totals.correct, totals.total);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <FlowHeader mission={mission} phase={phase} />

      {phase === 'goal' && <GoalStep mission={mission} onStart={advance} />}
      {phase === 'warmup' && <WarmupStep mission={mission} onDone={advance} />}
      {phase === 'vocabulary' && (
        <VocabularyStep mission={mission} onDone={advance} />
      )}
      {phase === 'dialogue' && (
        <DialogueStep mission={mission} onDone={advance} />
      )}
      {phase === 'practice' && (
        <PracticeSession mission={mission} onComplete={recordStep} />
      )}
      {phase === 'quiz' && (
        <MissionQuiz mission={mission} onComplete={recordStep} />
      )}
      {phase === 'reflection' && (
        <ReflectionStep
          value={reflection}
          onChange={setReflection}
          onDone={() => {
            setDurationMs(Date.now() - startedAt.current);
            advance();
          }}
        />
      )}
      {phase === 'summary' && (
        <SummaryStep
          mission={mission}
          accuracy={accuracy}
          durationMs={durationMs}
          reflection={reflection}
          nextTitle={nextTitle}
          homeHref={homeHref}
        />
      )}
    </div>
  );
}

const PHASE_LABEL: Record<MissionPhase, string> = {
  goal: "Today's goal",
  warmup: 'Warm-up',
  vocabulary: 'Vocabulary',
  dialogue: 'Dialogue',
  practice: 'Practice',
  quiz: 'Quiz',
  reflection: 'Reflection',
  summary: 'Summary',
};

function FlowHeader({
  mission,
  phase,
}: {
  mission: MissionContent;
  phase: MissionPhase;
}) {
  return (
    <header className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{mission.title}</span>
      <span>{PHASE_LABEL[phase]}</span>
    </header>
  );
}

function GoalStep({
  mission,
  onStart,
}: {
  mission: MissionContent;
  onStart: () => void;
}) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Today&apos;s Mission
        </p>
        <CardTitle className="text-xl">{mission.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{mission.goal}</p>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li className="rounded-full border bg-card px-3 py-1">
            📖 {mission.vocabulary.length} words
          </li>
          <li className="rounded-full border bg-card px-3 py-1">💬 Dialogue</li>
          <li className="rounded-full border bg-card px-3 py-1">✍️ Practice</li>
          <li className="rounded-full border bg-card px-3 py-1">
            ⏱️ ~{mission.estimatedMinutes} min · {mission.difficulty}
          </li>
        </ul>
        <Button className="w-full" size="lg" onClick={onStart}>
          Start warm-up
        </Button>
      </CardContent>
    </Card>
  );
}

function WarmupStep({
  mission,
  onDone,
}: {
  mission: MissionContent;
  onDone: () => void;
}) {
  const words = mission.vocabulary.slice(0, 3);
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const item = words[index]!;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Warm-up · {index + 1}/{words.length}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          A quick 30-second look before we start.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-2xl font-bold">{item.word}</p>
        {revealed ? (
          <p className="text-sm text-muted-foreground">{item.meaning}</p>
        ) : null}
        {!revealed ? (
          <Button className="w-full" onClick={() => setRevealed(true)}>
            Show meaning
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => {
              if (index + 1 >= words.length) onDone();
              else {
                setIndex((i) => i + 1);
                setRevealed(false);
              }
            }}
          >
            {index + 1 >= words.length ? 'Start learning' : 'Next'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function VocabularyStep({
  mission,
  onDone,
}: {
  mission: MissionContent;
  onDone: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const item = mission.vocabulary[index]!;
  const last = index + 1 >= mission.vocabulary.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Word {index + 1}/{mission.vocabulary.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-center">
        <p className="text-3xl font-bold">{item.word}</p>
        <p className="text-sm text-muted-foreground">{item.ipa}</p>
        {revealed ? (
          <div className="space-y-2 border-t pt-3">
            <p className="font-medium">{item.meaning}</p>
            <p className="text-sm italic text-muted-foreground">
              “{item.example}”
            </p>
          </div>
        ) : null}
        {!revealed ? (
          <Button className="w-full" onClick={() => setRevealed(true)}>
            Show meaning
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => {
              if (last) onDone();
              else {
                setIndex((i) => i + 1);
                setRevealed(false);
              }
            }}
          >
            {last ? 'Continue to dialogue' : 'Next word'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DialogueStep({
  mission,
  onDone,
}: {
  mission: MissionContent;
  onDone: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dialogue</CardTitle>
        <p className="text-xs text-muted-foreground">
          Read this short conversation.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {mission.dialogue.map((d, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="w-6 shrink-0 font-semibold text-muted-foreground">
                {d.speaker}:
              </span>
              <span>{d.line}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full" onClick={onDone}>
          Continue to practice
        </Button>
      </CardContent>
    </Card>
  );
}

const HARDEST_OPTIONS = ['Vocabulary', 'Dialogue', 'Practice', 'Nothing'];
const CONFIDENCE_OPTIONS = ['Not yet', 'Somewhat', 'Yes'];

function ReflectionStep({
  value,
  onChange,
  onDone,
}: {
  value: { hardest?: string; confidence?: string };
  onChange: (v: { hardest?: string; confidence?: string }) => void;
  onDone: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reflection</CardTitle>
        <p className="text-xs text-muted-foreground">
          A quick moment to think about today.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">What was hardest today?</p>
          <div className="flex flex-wrap gap-2">
            {HARDEST_OPTIONS.map((o) => (
              <Button
                key={o}
                size="sm"
                variant={value.hardest === o ? 'default' : 'outline'}
                onClick={() => onChange({ ...value, hardest: o })}
              >
                {o}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Do you feel confident using this in real life?
          </p>
          <div className="flex flex-wrap gap-2">
            {CONFIDENCE_OPTIONS.map((o) => (
              <Button
                key={o}
                size="sm"
                variant={value.confidence === o ? 'default' : 'outline'}
                onClick={() => onChange({ ...value, confidence: o })}
              >
                {o}
              </Button>
            ))}
          </div>
        </div>
        <Button
          className="w-full"
          disabled={!value.hardest || !value.confidence}
          onClick={onDone}
        >
          See summary
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryStep({
  mission,
  accuracy,
  durationMs,
  reflection,
  nextTitle,
  homeHref,
}: {
  mission: MissionContent;
  accuracy: number;
  durationMs: number;
  reflection: { hardest?: string; confidence?: string };
  nextTitle: string | null;
  homeHref: string;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
          <p className="text-lg font-semibold">Mission complete 🎉</p>
          <p className="text-sm text-muted-foreground">{mission.title}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Time" value={durationLabel(durationMs)} />
          <Row label="Accuracy" value={`${accuracy}%`} />
          <Row
            label="Words learned"
            value={String(mission.vocabulary.length)}
          />
          <Row
            label="Need review"
            value={`${mission.reviewFocus.length} words`}
          />
          {reflection.confidence ? (
            <Row label="Confidence" value={reflection.confidence} />
          ) : null}
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              Tomorrow&apos;s goal
            </p>
            <p>
              {nextTitle
                ? `Review these words + start “${nextTitle}”.`
                : 'Review these words + keep your streak going.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Added to your review queue
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Spaced repetition will bring these back on the right day.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {mission.reviewFocus.map((w) => (
              <li key={w} className="rounded-full bg-muted px-3 py-1 text-sm">
                {w}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button asChild className="w-full">
        <Link href={homeHref}>Back to dashboard</Link>
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
