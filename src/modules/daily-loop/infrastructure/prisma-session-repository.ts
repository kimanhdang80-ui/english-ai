import type { PrismaClient } from '@prisma/client';

import type { LearningSession } from '@/modules/daily-loop/domain/entities';
import type { SessionRepository } from '@/modules/daily-loop/application/ports';

/**
 * Durable learning-session store (`learning_sessions`, ADR-0005). Replaces the
 * in-memory skeleton (DEBT-016) so sessions survive process restarts and feed
 * streak/history/dashboard. Newest first, matching the previous contract.
 */
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(session: LearningSession): Promise<void> {
    await this.prisma.learningSession.create({
      data: {
        id: session.id,
        userId: session.userId,
        startedAt: new Date(session.startedAt),
        completedAt: new Date(session.completedAt),
        durationMs: session.durationMs,
        wordsStudied: session.wordsStudied,
        quizScore: session.quizScore,
        quizTotal: session.quizTotal,
      },
    });
  }

  async list(userId: string, limit: number): Promise<LearningSession[]> {
    const rows = await this.prisma.learningSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt.toISOString(),
      durationMs: r.durationMs,
      wordsStudied: r.wordsStudied,
      quizScore: r.quizScore,
      quizTotal: r.quizTotal,
    }));
  }
}
