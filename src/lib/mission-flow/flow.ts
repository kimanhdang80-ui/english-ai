/**
 * Mission learning-flow model (Task 05) — pure, framework-free. Defines the phase order of a
 * complete mission session and small scoring helpers. No engine/DB/library change; this only
 * describes how the UI walks a mission the learner already has.
 */

export type MissionPhase =
  | 'goal' // Today's Goal
  | 'warmup' // 30–60s recall of a few words
  | 'vocabulary' // learn the words
  | 'dialogue' // read a short dialogue
  | 'practice' // fill-blank + arrange + matching
  | 'quiz' // multiple choice
  | 'reflection' // self-assessment
  | 'summary'; // session summary + review queue

export const MISSION_PHASES: readonly MissionPhase[] = [
  'goal',
  'warmup',
  'vocabulary',
  'dialogue',
  'practice',
  'quiz',
  'reflection',
  'summary',
];

/** The next phase in the flow, or null at the end. */
export function nextPhase(phase: MissionPhase): MissionPhase | null {
  const i = MISSION_PHASES.indexOf(phase);
  return i >= 0 && i < MISSION_PHASES.length - 1
    ? (MISSION_PHASES[i + 1] as MissionPhase)
    : null;
}

/** Accuracy as a whole percentage 0–100 (0 when nothing was attempted). */
export function accuracyPct(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.max(0, correct) / total) * 100);
}

/** Elapsed time as "Xm Ys". */
export function durationLabel(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
