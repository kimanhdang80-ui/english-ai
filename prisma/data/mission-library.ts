import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  MissionContentSchema,
  TrackContentSchema,
  type MissionContent,
  type TrackContent,
} from '../../src/content/mission-schema';

/**
 * Seed-time loader for the Mission Library. Reads the authored JSON under `content/*`,
 * validates every file with the shared Zod schema, and returns typed documents for
 * `prisma:seed` to insert into `content_tracks` / `content_missions` (ADR-0005).
 *
 * This is the ONLY place that reads the content filesystem — the runtime reads missions
 * from the database (src/content/mission-loader.ts). Node-only (no `server-only`).
 */
const CONTENT_DIR = join(process.cwd(), 'content');

export function loadTracks(): TrackContent[] {
  const dir = join(CONTENT_DIR, 'tracks');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) =>
      TrackContentSchema.parse(JSON.parse(readFileSync(join(dir, f), 'utf8'))),
    )
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function loadMissions(trackKey: string): MissionContent[] {
  const dir = join(CONTENT_DIR, 'missions', trackKey);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) =>
      MissionContentSchema.parse(
        JSON.parse(readFileSync(join(dir, f), 'utf8')),
      ),
    )
    .sort((a, b) => a.order - b.order);
}
