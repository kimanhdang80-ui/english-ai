import type { LessonPlan } from '@/modules/daily-loop/domain/planning';
import type { LessonPlanRepository } from '@/modules/daily-loop/application/ports';

/**
 * In-memory lesson-plan store — **TEST-ONLY fake** (RC-03). The runtime now uses
 * `PrismaLessonPlanRepository` (`lesson_plans`, ADR-0005); this is retained only as a
 * fast, deterministic test double for the planner/lesson services. Not wired into any
 * container. No mock data; it stores exactly what it's given.
 */
export class InMemoryLessonPlanRepository implements LessonPlanRepository {
  private readonly latestByUser = new Map<string, LessonPlan>();

  async save(userId: string, plan: LessonPlan): Promise<void> {
    this.latestByUser.set(userId, plan);
  }

  async latest(userId: string): Promise<LessonPlan | null> {
    return this.latestByUser.get(userId) ?? null;
  }
}
