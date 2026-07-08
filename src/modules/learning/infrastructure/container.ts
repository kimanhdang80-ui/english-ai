import 'server-only';

import { prisma } from '@/lib/prisma';

import { CourseService } from '@/modules/learning/application/services/course-service';
import { ExerciseService } from '@/modules/learning/application/services/exercise-service';
import { LearningPathService } from '@/modules/learning/application/services/learning-path-service';
import { LessonService } from '@/modules/learning/application/services/lesson-service';
import { ProgressService } from '@/modules/learning/application/services/progress-service';
import { QuestionService } from '@/modules/learning/application/services/question-service';

import {
  PrismaActivityRepository,
  PrismaCourseRepository,
  PrismaExerciseRepository,
  PrismaLearningPathRepository,
  PrismaLessonRepository,
  PrismaQuestionRepository,
  PrismaUnitRepository,
} from './repositories';

/**
 * Composition root for the Learning Engine — wires application services to their
 * Prisma-backed repositories. Presentation (API routes / server components) imports
 * `learning` and never touches Prisma or repositories directly.
 *
 * When this module is extracted to `packages/learning-engine`, only this file's
 * imports change.
 */
const courseRepo = new PrismaCourseRepository(prisma);
const unitRepo = new PrismaUnitRepository(prisma);
const lessonRepo = new PrismaLessonRepository(prisma);
const activityRepo = new PrismaActivityRepository(prisma);
const exerciseRepo = new PrismaExerciseRepository(prisma);
const questionRepo = new PrismaQuestionRepository(prisma);
const pathRepo = new PrismaLearningPathRepository(prisma);

export const learning = {
  courses: new CourseService(courseRepo, unitRepo),
  lessons: new LessonService(lessonRepo, activityRepo),
  exercises: new ExerciseService(exerciseRepo),
  questions: new QuestionService(questionRepo),
  paths: new LearningPathService(pathRepo),
  progress: new ProgressService(),
};

export type LearningContainer = typeof learning;
