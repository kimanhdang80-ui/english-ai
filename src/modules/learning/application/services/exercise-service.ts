import { NotFoundError } from '@/modules/learning/domain/errors';
import type { Exercise } from '@/modules/learning/domain/entities';

import type { ExerciseRepository } from '@/modules/learning/application/ports';

/** Exercise use cases (read-oriented for Sprint 3.1). */
export class ExerciseService {
  constructor(private readonly exercises: ExerciseRepository) {}

  listByActivity(activityId: string): Promise<Exercise[]> {
    return this.exercises.listByActivity(activityId);
  }

  async getExercise(id: string): Promise<Exercise> {
    const exercise = await this.exercises.findById(id);
    if (!exercise) throw new NotFoundError('Exercise', id);
    return exercise;
  }
}
