import 'server-only';

import { prisma } from '@/lib/prisma';

import {
  MissionContentSchema,
  TrackContentSchema,
  type MissionContent,
  type TrackContent,
} from './mission-schema';

/**
 * Reads the Mission Library from the DATABASE (`content_tracks` / `content_missions`,
 * ADR-0005) for the mission-flow UI. The authored JSON under `content/*` is now used
 * ONLY as the seed source (prisma/data/mission-library.ts + prisma:seed) — the runtime
 * never touches the filesystem. Every document is re-validated with the shared schema, so
 * a malformed row fails loudly instead of rendering garbage.
 */
export async function listTracks(): Promise<TrackContent[]> {
  const rows = await prisma.contentTrack.findMany({ orderBy: { key: 'asc' } });
  return rows.map((r) => TrackContentSchema.parse(r.data));
}

export async function getTrack(key: string): Promise<TrackContent | null> {
  const row = await prisma.contentTrack.findUnique({ where: { key } });
  return row ? TrackContentSchema.parse(row.data) : null;
}

export async function getMissionById(
  id: string,
): Promise<MissionContent | null> {
  const row = await prisma.contentMission.findUnique({ where: { id } });
  return row ? MissionContentSchema.parse(row.data) : null;
}

/** The title of the next mission in the same track (for "Tomorrow's goal"), or null. */
export async function nextMissionTitle(
  mission: MissionContent,
): Promise<string | null> {
  const track = await getTrack(mission.trackId);
  if (!track) return null;
  const idx = track.missionIds.indexOf(mission.id);
  const nextId =
    idx >= 0 && idx < track.missionIds.length - 1
      ? track.missionIds[idx + 1]
      : null;
  if (!nextId) return null;
  return (await getMissionById(nextId))?.title ?? null;
}
