import 'server-only';

import type { PrismaClient } from '@prisma/client';

import type {
  Activity,
  Course,
  Exercise,
  Lesson,
  LearningPath,
  Question,
  Unit,
} from '@/modules/learning/domain/entities';
import {
  toPage,
  toSkipTake,
  type Page,
  type PageQuery,
} from '@/modules/learning/domain/pagination';
import type {
  ActivityRepository,
  CourseFilter,
  CourseRepository,
  ExerciseRepository,
  LearningPathRepository,
  LessonFilter,
  LessonRepository,
  QuestionRepository,
  UnitRepository,
} from '@/modules/learning/application/ports';

import {
  toActivity,
  toCourse,
  toExercise,
  toLearningPath,
  toLesson,
  toQuestion,
  toUnit,
} from './mappers';

/**
 * Prisma-backed repository implementations. Read-only for Sprint 3.1. All queries
 * exclude soft-deleted rows (`deletedAt: null`) and order by `sortOrder`.
 */

export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(filter: CourseFilter, page: PageQuery): Promise<Page<Course>> {
    const where = {
      deletedAt: null,
      ...(filter.track ? { track: filter.track as never } : {}),
      ...(filter.status ? { status: filter.status as never } : {}),
      ...(filter.cefrLevelId ? { cefrLevelId: filter.cefrLevelId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.course.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        ...toSkipTake(page),
      }),
      this.db.course.count({ where }),
    ]);
    return toPage(rows.map(toCourse), total, page);
  }

  async findById(id: string): Promise<Course | null> {
    const row = await this.db.course.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? toCourse(row) : null;
  }
}

export class PrismaUnitRepository implements UnitRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(
    courseId: string | undefined,
    page: PageQuery,
  ): Promise<Page<Unit>> {
    const where = { deletedAt: null, ...(courseId ? { courseId } : {}) };
    const [rows, total] = await Promise.all([
      this.db.unit.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        ...toSkipTake(page),
      }),
      this.db.unit.count({ where }),
    ]);
    return toPage(rows.map(toUnit), total, page);
  }

  async findById(id: string): Promise<Unit | null> {
    const row = await this.db.unit.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? toUnit(row) : null;
  }
}

export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(filter: LessonFilter, page: PageQuery): Promise<Page<Lesson>> {
    const where = {
      deletedAt: null,
      ...(filter.unitId ? { unitId: filter.unitId } : {}),
      ...(filter.status ? { status: filter.status as never } : {}),
      ...(filter.primarySkillId
        ? { primarySkillId: filter.primarySkillId }
        : {}),
      ...(filter.difficultyId ? { difficultyId: filter.difficultyId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.db.lesson.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        ...toSkipTake(page),
      }),
      this.db.lesson.count({ where }),
    ]);
    return toPage(rows.map(toLesson), total, page);
  }

  async findById(id: string): Promise<Lesson | null> {
    const row = await this.db.lesson.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? toLesson(row) : null;
  }
}

export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly db: PrismaClient) {}

  async listByLessonVersion(lessonVersionId: string): Promise<Activity[]> {
    const rows = await this.db.activity.findMany({
      where: { lessonVersionId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toActivity);
  }

  async findById(id: string): Promise<Activity | null> {
    const row = await this.db.activity.findUnique({ where: { id } });
    return row ? toActivity(row) : null;
  }
}

export class PrismaExerciseRepository implements ExerciseRepository {
  constructor(private readonly db: PrismaClient) {}

  async listByActivity(activityId: string): Promise<Exercise[]> {
    const rows = await this.db.exercise.findMany({
      where: { activityId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toExercise);
  }

  async findById(id: string): Promise<Exercise | null> {
    const row = await this.db.exercise.findUnique({ where: { id } });
    return row ? toExercise(row) : null;
  }
}

export class PrismaQuestionRepository implements QuestionRepository {
  constructor(private readonly db: PrismaClient) {}

  async listByExercise(exerciseId: string): Promise<Question[]> {
    const rows = await this.db.question.findMany({
      where: { exerciseId },
      orderBy: { sortOrder: 'asc' },
      include: { choices: { orderBy: { sortOrder: 'asc' } } },
    });
    return rows.map(toQuestion);
  }

  async findById(id: string): Promise<Question | null> {
    const row = await this.db.question.findUnique({
      where: { id },
      include: { choices: { orderBy: { sortOrder: 'asc' } } },
    });
    return row ? toQuestion(row) : null;
  }
}

export class PrismaLearningPathRepository implements LearningPathRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(page: PageQuery): Promise<Page<LearningPath>> {
    const where = { deletedAt: null };
    const [rows, total] = await Promise.all([
      this.db.learningPath.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        ...toSkipTake(page),
      }),
      this.db.learningPath.count({ where }),
    ]);
    return toPage(rows.map(toLearningPath), total, page);
  }

  async findById(id: string): Promise<LearningPath | null> {
    const row = await this.db.learningPath.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? toLearningPath(row) : null;
  }
}
