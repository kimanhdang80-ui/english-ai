import type { PrismaClient } from '@prisma/client';

import type { MissionProgress } from '@/modules/learning/domain/mission/entities';
import type { UserProgressPort } from '@/modules/learning/application/mission/ports';

/**
 * Durable mission-progress store (`mission_progress`, ADR-0005). Replaces the in-memory
 * skeleton so a learner's mission progress survives restarts. A mission counts as
 * "completed" (for `completedMissionIds`) once it has at least one completed activity —
 * matching the previous in-memory semantics exactly.
 */
export class PrismaUserProgressRepository implements UserProgressPort {
  constructor(private readonly prisma: PrismaClient) {}

  async completedMissionIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.missionProgress.findMany({
      where: { userId },
      select: { missionId: true, completedActivityIds: true },
    });
    return rows
      .filter((r) => toStringArray(r.completedActivityIds).length > 0)
      .map((r) => r.missionId);
  }

  async missionProgress(
    userId: string,
    missionId: string,
  ): Promise<MissionProgress | null> {
    const row = await this.prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (!row) return null;
    return {
      missionId: row.missionId,
      completedActivityIds: toStringArray(row.completedActivityIds),
      quizScore: row.quizScore ?? undefined,
      quizTotal: row.quizTotal ?? undefined,
    };
  }

  /** Records/updates a learner's mission progress (upsert on [userId, missionId]). */
  async record(userId: string, progress: MissionProgress): Promise<void> {
    const completedActivityIds = progress.completedActivityIds;
    await this.prisma.missionProgress.upsert({
      where: { userId_missionId: { userId, missionId: progress.missionId } },
      update: {
        completedActivityIds,
        quizScore: progress.quizScore ?? null,
        quizTotal: progress.quizTotal ?? null,
      },
      create: {
        userId,
        missionId: progress.missionId,
        completedActivityIds,
        quizScore: progress.quizScore ?? null,
        quizTotal: progress.quizTotal ?? null,
      },
    });
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
