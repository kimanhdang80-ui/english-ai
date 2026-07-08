import { NotFoundError } from '@/lib/errors';
import type { Page, PageQuery } from '@/modules/learning/domain/pagination';

import type {
  Vocabulary,
  VocabularySummary,
} from '@/modules/vocabulary/domain/entities';
import type { QuizItem } from '@/modules/vocabulary/domain/quiz';
import type {
  VocabularyFilter,
  VocabularyRepository,
} from '@/modules/vocabulary/application/ports';

/** Read use cases over the vocabulary corpus. */
export class VocabularyService {
  constructor(private readonly repo: VocabularyRepository) {}

  listVocabularies(
    filter: VocabularyFilter,
    page: PageQuery,
  ): Promise<Page<VocabularySummary>> {
    return this.repo.list(filter, page);
  }

  async getVocabulary(id: string): Promise<Vocabulary> {
    const vocab = await this.repo.findById(id);
    if (!vocab) throw new NotFoundError('Vocabulary', id);
    return vocab;
  }

  getQuizItems(limit = 20): Promise<QuizItem[]> {
    return this.repo.quizItems(limit);
  }
}
