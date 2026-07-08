/**
 * Infrastructure — Prisma row → domain read-model mappers.
 * The only place allowed to know both Prisma and domain shapes.
 */
import type {
  Activity as PActivity,
  Choice as PChoice,
  Course as PCourse,
  Exercise as PExercise,
  LearningPath as PLearningPath,
  Lesson as PLesson,
  Question as PQuestion,
  Unit as PUnit,
} from '@prisma/client';

import type {
  Activity,
  ActivityType,
  Choice,
  ContentStatus,
  Course,
  CourseTrack,
  Exercise,
  ExerciseType,
  Lesson,
  LearningPath,
  Question,
  QuestionType,
  Unit,
} from '@/modules/learning/domain/entities';

export function toCourse(row: PCourse): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    track: row.track as CourseTrack,
    status: row.status as ContentStatus,
    cefrLevelId: row.cefrLevelId,
    sortOrder: row.sortOrder,
  };
}

export function toUnit(row: PUnit): Unit {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.description,
    status: row.status as ContentStatus,
    sortOrder: row.sortOrder,
  };
}

export function toLesson(row: PLesson): Lesson {
  return {
    id: row.id,
    unitId: row.unitId,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    primarySkillId: row.primarySkillId,
    cefrLevelId: row.cefrLevelId,
    difficultyId: row.difficultyId,
    status: row.status as ContentStatus,
    estimatedMinutes: row.estimatedMinutes,
    xpReward: row.xpReward,
    currentVersionId: row.currentVersionId,
    sortOrder: row.sortOrder,
  };
}

export function toActivity(row: PActivity): Activity {
  return {
    id: row.id,
    lessonVersionId: row.lessonVersionId,
    type: row.type as ActivityType,
    title: row.title,
    instructions: row.instructions,
    sortOrder: row.sortOrder,
  };
}

export function toExercise(row: PExercise): Exercise {
  return {
    id: row.id,
    activityId: row.activityId,
    type: row.type as ExerciseType,
    prompt: row.prompt,
    difficultyId: row.difficultyId,
    sortOrder: row.sortOrder,
  };
}

export function toChoice(row: PChoice): Choice {
  return {
    id: row.id,
    questionId: row.questionId,
    label: row.label,
    content: row.content,
    isCorrect: row.isCorrect,
    sortOrder: row.sortOrder,
  };
}

export function toQuestion(row: PQuestion & { choices?: PChoice[] }): Question {
  return {
    id: row.id,
    exerciseId: row.exerciseId,
    type: row.type as QuestionType,
    prompt: row.prompt,
    explanation: row.explanation,
    difficultyId: row.difficultyId,
    sortOrder: row.sortOrder,
    choices: row.choices?.map(toChoice),
  };
}

export function toLearningPath(row: PLearningPath): LearningPath {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    track: row.track as CourseTrack,
    status: row.status as ContentStatus,
  };
}
