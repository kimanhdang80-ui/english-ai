import { NotFoundError } from '@/modules/learning/domain/errors';
import type { Course, Unit } from '@/modules/learning/domain/entities';
import type { Page, PageQuery } from '@/modules/learning/domain/pagination';

import type {
  CourseFilter,
  CourseRepository,
  UnitRepository,
} from '@/modules/learning/application/ports';

/**
 * Course use cases. Thin orchestration only — no complex business logic yet
 * (Sprint 3.1 scope). Depends on repository ports, never Prisma.
 */
export class CourseService {
  constructor(
    private readonly courses: CourseRepository,
    private readonly units: UnitRepository,
  ) {}

  listCourses(filter: CourseFilter, page: PageQuery): Promise<Page<Course>> {
    return this.courses.list(filter, page);
  }

  async getCourse(id: string): Promise<Course> {
    const course = await this.courses.findById(id);
    if (!course) throw new NotFoundError('Course', id);
    return course;
  }

  listUnits(
    courseId: string | undefined,
    page: PageQuery,
  ): Promise<Page<Unit>> {
    return this.units.list(courseId, page);
  }
}
