/**
 * Learning Engine — application ports (repository interfaces).
 *
 * The application layer depends on these abstractions, never on Prisma. Concrete
 * implementations live in `infrastructure/`. This is the hexagonal boundary
 * (CLAUDE.md §3). Methods are read-oriented for Sprint 3.1; write paths are added
 * as authoring/progress features land.
 */
import type {
  Activity,
  Course,
  Exercise,
  Lesson,
  LearningPath,
  Question,
  Unit,
} from '@/modules/learning/domain/entities';
import type { Page, PageQuery } from '@/modules/learning/domain/pagination';

export interface CourseFilter {
  track?: string;
  status?: string;
  cefrLevelId?: string;
}

export interface LessonFilter {
  unitId?: string;
  status?: string;
  primarySkillId?: string;
  difficultyId?: string;
}

export interface CourseRepository {
  list(filter: CourseFilter, page: PageQuery): Promise<Page<Course>>;
  findById(id: string): Promise<Course | null>;
}

export interface UnitRepository {
  list(courseId: string | undefined, page: PageQuery): Promise<Page<Unit>>;
  findById(id: string): Promise<Unit | null>;
}

export interface LessonRepository {
  list(filter: LessonFilter, page: PageQuery): Promise<Page<Lesson>>;
  findById(id: string): Promise<Lesson | null>;
}

export interface ActivityRepository {
  listByLessonVersion(lessonVersionId: string): Promise<Activity[]>;
  findById(id: string): Promise<Activity | null>;
}

export interface ExerciseRepository {
  listByActivity(activityId: string): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
}

export interface QuestionRepository {
  listByExercise(exerciseId: string): Promise<Question[]>;
  findById(id: string): Promise<Question | null>;
}

export interface LearningPathRepository {
  list(page: PageQuery): Promise<Page<LearningPath>>;
  findById(id: string): Promise<LearningPath | null>;
}
