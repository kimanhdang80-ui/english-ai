import { NotFoundError } from '@/modules/learning/domain/errors';
import type { Question } from '@/modules/learning/domain/entities';

import type { QuestionRepository } from '@/modules/learning/application/ports';

/** Question use cases (read-oriented for Sprint 3.1). */
export class QuestionService {
  constructor(private readonly questions: QuestionRepository) {}

  listByExercise(exerciseId: string): Promise<Question[]> {
    return this.questions.listByExercise(exerciseId);
  }

  async getQuestion(id: string): Promise<Question> {
    const question = await this.questions.findById(id);
    if (!question) throw new NotFoundError('Question', id);
    return question;
  }
}
