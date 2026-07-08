/**
 * Mission Engine — domain entities (framework-free, pure). Implements Learning Model V2
 * (docs/migration/LEARNING_MODEL_V2.md): **Mission is central**; Vocabulary / Dialogue /
 * Quiz / Review / Listening / Speaking are all **Activities**. Backward compatible — the old
 * `Lesson` tree is untouched; a Lesson wraps a Mission via the adapter.
 *
 * This is the CONTENT model (Mission → Activity → Exercise → Question). The daily planner
 * (Task 02) decides the lesson *shape*; the Mission Engine holds the *structure* + rules.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Lifecycle state of a mission for a learner (see MISSION_ENGINE.md state diagram). */
export type MissionState = 'locked' | 'available' | 'in_progress' | 'completed';

/**
 * Activity taxonomy. `listening`/`speaking` are **placeholders** — declared for extension
 * only; no content is built for them yet (see activity-builders.ts).
 */
export type ActivityType =
  'vocabulary' | 'dialogue' | 'quiz' | 'review' | 'listening' | 'speaking';

/** Exercise (interaction) formats supported by the engine. */
export type ExerciseType =
  'multiple_choice' | 'fill_blank' | 'match' | 'arrange';

export interface Hint {
  text: string;
}

/** Answer key entry (not a user submission). */
export interface Answer {
  value: string;
  isPrimary: boolean;
  matchMode: 'exact' | 'ci' | 'contains';
}

export interface Question {
  id: string;
  prompt: string;
  answers: Answer[];
  hint?: Hint | null;
  explanation?: string | null;
  difficulty: Difficulty;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt?: string | null;
  difficulty: Difficulty;
  questions: Question[];
}

export interface MissionActivity {
  id: string;
  type: ActivityType;
  title: string;
  instructions?: string | null;
  sortOrder: number;
  /** false = declared but not yet available (placeholders like listening/speaking). */
  available: boolean;
  exercises: Exercise[];
}

/** A goal×CEFR lane that groups missions (Learning Model V2). */
export interface LearningTrack {
  id: string;
  title: string;
  goal: string; // learning-goal kind, e.g. 'general'
  cefr: string;
}

/** How a mission is judged complete (evaluated by the CompletionService). */
export interface CompletionRule {
  type: 'all_available_activities' | 'min_quiz_score';
  /** Required quiz accuracy 0..1 (for `min_quiz_score`). */
  minQuizScore?: number;
}

export interface Mission {
  id: string;
  trackId: string;
  title: string;
  learningGoal: string;
  cefr: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  activities: MissionActivity[];
  completionRule: CompletionRule;
  /** Ordering within the track. */
  sortOrder: number;
}

/** A learner's progress against a single mission (input to the CompletionService). */
export interface MissionProgress {
  missionId: string;
  completedActivityIds: string[];
  quizScore?: number; // 0..1
  quizTotal?: number;
}
