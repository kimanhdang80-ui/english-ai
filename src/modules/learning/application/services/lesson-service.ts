import { NotFoundError } from '@/modules/learning/domain/errors';
import type { Activity, Lesson } from '@/modules/learning/domain/entities';
import type { Page, PageQuery } from '@/modules/learning/domain/pagination';

import type {
  ActivityRepository,
  LessonFilter,
  LessonRepository,
} from '@/modules/learning/application/ports';

/** Lesson use cases (read-oriented for Sprint 3.1). */
export class LessonService {
  constructor(
    private readonly lessons: LessonRepository,
    private readonly activities: ActivityRepository,
  ) {}

  listLessons(filter: LessonFilter, page: PageQuery): Promise<Page<Lesson>> {
    return this.lessons.list(filter, page);
  }

  async getLesson(id: string): Promise<Lesson> {
    const lesson = await this.lessons.findById(id);
    if (!lesson) throw new NotFoundError('Lesson', id);
    return lesson;
  }

  /** Activities of a lesson's current published version. */
  async listActivities(lessonVersionId: string): Promise<Activity[]> {
    return this.activities.listByLessonVersion(lessonVersionId);
  }
}
