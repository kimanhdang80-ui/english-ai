import { NotFoundError } from '@/modules/learning/domain/errors';
import type { LearningPath } from '@/modules/learning/domain/entities';
import type { Page, PageQuery } from '@/modules/learning/domain/pagination';

import type { LearningPathRepository } from '@/modules/learning/application/ports';

/** Learning path use cases (read-oriented for Sprint 3.1). */
export class LearningPathService {
  constructor(private readonly paths: LearningPathRepository) {}

  listPaths(page: PageQuery): Promise<Page<LearningPath>> {
    return this.paths.list(page);
  }

  async getPath(id: string): Promise<LearningPath> {
    const path = await this.paths.findById(id);
    if (!path) throw new NotFoundError('LearningPath', id);
    return path;
  }
}
