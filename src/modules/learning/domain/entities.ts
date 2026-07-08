/**
 * Learning Engine — domain read models (framework-free, no Prisma imports).
 *
 * These are the shapes the application layer returns and the presentation layer
 * serializes. They are intentionally decoupled from Prisma row types so the DB can
 * change without breaking the contract. Enum unions mirror the Prisma enums.
 */

export type ContentStatus = 'draft' | 'published' | 'archived';
export type CourseTrack = 'general' | 'toeic' | 'ielts' | 'business' | 'kids';
export type ActivityType =
  'intro' | 'teach' | 'practice' | 'quiz' | 'review' | 'assessment';
export type ExerciseType =
  | 'flashcard'
  | 'multiple_choice'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'dictation'
  | 'speaking'
  | 'listening'
  | 'open_response';
export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'short_answer'
  | 'matching'
  | 'ordering';
export type DependencyType = 'prerequisite' | 'recommended';
export type PathStepType = 'course' | 'lesson' | 'objective';

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  track: CourseTrack;
  status: ContentStatus;
  cefrLevelId: string | null;
  sortOrder: number;
}

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  sortOrder: number;
}

export interface Lesson {
  id: string;
  unitId: string;
  slug: string;
  title: string;
  summary: string | null;
  primarySkillId: string | null;
  cefrLevelId: string | null;
  difficultyId: string | null;
  status: ContentStatus;
  estimatedMinutes: number;
  xpReward: number;
  currentVersionId: string | null;
  sortOrder: number;
}

export interface Activity {
  id: string;
  lessonVersionId: string;
  type: ActivityType;
  title: string | null;
  instructions: string | null;
  sortOrder: number;
}

export interface Exercise {
  id: string;
  activityId: string;
  type: ExerciseType;
  prompt: string | null;
  difficultyId: string | null;
  sortOrder: number;
}

export interface Choice {
  id: string;
  questionId: string;
  label: string | null;
  content: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface Question {
  id: string;
  exerciseId: string;
  type: QuestionType;
  prompt: string;
  explanation: string | null;
  difficultyId: string | null;
  sortOrder: number;
  choices?: Choice[];
}

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  track: CourseTrack;
  status: ContentStatus;
}

/** Input contract for recording learner progress (implemented in a later sprint). */
export interface ProgressInput {
  lessonId: string;
  activityId?: string;
  exerciseId?: string;
  questionId?: string;
  outcome: 'started' | 'completed' | 'answered';
  score?: number;
}
