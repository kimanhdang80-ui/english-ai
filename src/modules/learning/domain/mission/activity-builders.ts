import { NotImplementedError } from '@/lib/errors';

import type { ActivityType, MissionActivity } from './entities';

/**
 * Extension seam for activity types. Every activity kind is produced by an `ActivityBuilder`;
 * new skills (listening, speaking, grammar, …) are added by registering a builder — no engine
 * rewrite (Open/Closed). Vocabulary / Dialogue / Quiz / Review are supported; Listening /
 * Speaking are **placeholders** that declare an unavailable activity (interface only).
 */
export interface ActivityBuildInput {
  id: string;
  title: string;
  instructions?: string | null;
  sortOrder: number;
}

export interface ActivityBuilder {
  readonly type: ActivityType;
  readonly supported: boolean;
  build(input: ActivityBuildInput): MissionActivity;
}

/** Canonical activity order within a mission (Vocabulary → Dialogue → Quiz → Review → …). */
export const ACTIVITY_ORDER: readonly ActivityType[] = [
  'vocabulary',
  'dialogue',
  'quiz',
  'review',
  'listening',
  'speaking',
];

function supportedBuilder(type: ActivityType): ActivityBuilder {
  return {
    type,
    supported: true,
    build: (input) => ({
      id: input.id,
      type,
      title: input.title,
      instructions: input.instructions ?? null,
      sortOrder: input.sortOrder,
      available: true,
      exercises: [], // exercises are attached from mission content, not fabricated here
    }),
  };
}

/** Placeholder builder — declares the activity but marks it unavailable (no content yet). */
function placeholderBuilder(type: ActivityType): ActivityBuilder {
  return {
    type,
    supported: false,
    build: (input) => ({
      id: input.id,
      type,
      title: input.title,
      instructions: input.instructions ?? null,
      sortOrder: input.sortOrder,
      available: false,
      exercises: [],
    }),
  };
}

/** The registry — the single place to extend the engine with new activity types. */
export const ACTIVITY_BUILDERS: Record<ActivityType, ActivityBuilder> = {
  vocabulary: supportedBuilder('vocabulary'),
  dialogue: supportedBuilder('dialogue'),
  quiz: supportedBuilder('quiz'),
  review: supportedBuilder('review'),
  listening: placeholderBuilder('listening'),
  speaking: placeholderBuilder('speaking'),
};

export function isSupportedActivity(type: ActivityType): boolean {
  return ACTIVITY_BUILDERS[type].supported;
}

/**
 * Guard for code that requires a real (non-placeholder) activity — throws for
 * listening/speaking until they are implemented. Interface exists; behavior is deferred.
 */
export function assertActivityImplemented(type: ActivityType): void {
  if (!ACTIVITY_BUILDERS[type].supported) {
    throw new NotImplementedError(`Activity type "${type}"`);
  }
}
