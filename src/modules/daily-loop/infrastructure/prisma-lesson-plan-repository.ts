import type { PrismaClient, Prisma } from '@prisma/client';

import type { LessonPlan } from '@/modules/daily-loop/domain/planning';
import type { LessonPlanRepository } from '@/modules/daily-loop/application/ports';

/**
 * Durable lesson-plan store (`lesson_plans`, ADR-0005). Replaces the in-memory
 * skeleton — persists the latest plan per user (one row, upserted each planning),
 * so `latest()` survives restarts. The plan is stored as a JSON document; it is a
 * derived read model (no learning content), safe to re-serialize verbatim.
 */
export class PrismaLessonPlanRepository implements LessonPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(userId: string, plan: LessonPlan): Promise<void> {
    const data = plan as unknown as Prisma.InputJsonValue;
    await this.prisma.lessonPlanRecord.upsert({
      where: { userId },
      update: { planDate: plan.date, data },
      create: { userId, planDate: plan.date, data },
    });
  }

  async latest(userId: string): Promise<LessonPlan | null> {
    const row = await this.prisma.lessonPlanRecord.findUnique({
      where: { userId },
    });
    return row ? (row.data as unknown as LessonPlan) : null;
  }
}
