import type { PrismaClient } from '@prisma/client';

import { NotImplementedError } from '@/lib/errors';
import { MissionContentSchema } from '@/content/mission-schema';
import type { Mission } from '@/modules/learning/domain/mission/entities';
import type { MissionRepository } from '@/modules/learning/application/mission/ports';

import { missionContentToEngineMission } from './mission-content-mapper';

/**
 * Reads missions from the Mission Library in the DATABASE (`content_missions`, ADR-0005)
 * and maps each stored `MissionContent` into the engine's `Mission`. Replaces the empty
 * in-memory skeleton — the engine now reads the same authored content as the flow UI,
 * from the DB. Documents are re-validated with the shared schema before mapping.
 */
export class PrismaMissionRepository implements MissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Mission | null> {
    const row = await this.prisma.contentMission.findUnique({
      where: { id },
      include: { track: true },
    });
    if (!row) return null;
    const content = MissionContentSchema.parse(row.data);
    return missionContentToEngineMission(content, row.track.cefr);
  }

  async listByTrack(trackId: string): Promise<Mission[]> {
    // Engine `trackId` equals the Mission Library track key (e.g. 'general').
    const rows = await this.prisma.contentMission.findMany({
      where: { trackKey: trackId },
      include: { track: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((row) =>
      missionContentToEngineMission(
        MissionContentSchema.parse(row.data),
        row.track.cefr,
      ),
    );
  }

  async save(): Promise<void> {
    // Missions are authored content: they are written to `content_missions` by the
    // Mission Library seed (prisma:seed), not through the engine at runtime.
    throw new NotImplementedError(
      'MissionRepository.save (missions are authored via the Mission Library seed)',
    );
  }
}
