import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  MissionContentSchema,
  TrackContentSchema,
  type MissionContent,
  type TrackContent,
} from './mission-schema';

/**
 * Validates the authored Mission Library (content/*) against the schema. This is the quality
 * gate for the content: structure, counts, id/prerequisite chains, and review-focus integrity.
 */
const CONTENT = join(process.cwd(), 'content');
const KEYS = ['general', 'business', 'construction', 'travel'] as const;

function loadTrack(key: string): TrackContent {
  const raw = readFileSync(join(CONTENT, 'tracks', `${key}.json`), 'utf8');
  return TrackContentSchema.parse(JSON.parse(raw));
}

function loadMissions(key: string): MissionContent[] {
  const dir = join(CONTENT, 'missions', key);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) =>
      MissionContentSchema.parse(
        JSON.parse(readFileSync(join(dir, f), 'utf8')),
      ),
    );
}

describe('Mission Library — tracks', () => {
  it('has exactly 4 tracks with the expected keys', () => {
    const tracks = KEYS.map(loadTrack);
    expect(tracks).toHaveLength(4);
    expect(tracks.map((t) => t.key).sort()).toEqual([...KEYS].sort());
  });

  it('each track lists 10 mission ids matching its mission files', () => {
    for (const key of KEYS) {
      const track = loadTrack(key);
      const missionIds = loadMissions(key).map((m) => m.id);
      expect(track.missionIds).toHaveLength(10);
      expect([...track.missionIds].sort()).toEqual([...missionIds].sort());
    }
  });
});

describe('Mission Library — missions', () => {
  it('has 40 missions total (10 per track), all schema-valid', () => {
    const all = KEYS.flatMap(loadMissions);
    expect(all).toHaveLength(40);
  });

  it('ids, trackId and order are consistent and unique per track', () => {
    for (const key of KEYS) {
      const missions = loadMissions(key);
      const orders = missions.map((m) => m.order).sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (const m of missions) {
        expect(m.trackId).toBe(key);
        expect(m.id).toBe(`${key}-${String(m.order).padStart(2, '0')}`);
      }
    }
  });

  it('prerequisites chain linearly (first is null, others point to the previous)', () => {
    for (const key of KEYS) {
      const byOrder = new Map(loadMissions(key).map((m) => [m.order, m]));
      for (let order = 1; order <= 10; order++) {
        const m = byOrder.get(order)!;
        if (order === 1) expect(m.prerequisite).toBeNull();
        else
          expect(m.prerequisite).toBe(
            `${key}-${String(order - 1).padStart(2, '0')}`,
          );
      }
    }
  });

  it('review focus words are all drawn from the mission vocabulary', () => {
    for (const m of KEYS.flatMap(loadMissions)) {
      const vocab = new Set(m.vocabulary.map((v) => v.word.toLowerCase()));
      for (const w of m.reviewFocus) {
        expect(vocab.has(w.toLowerCase())).toBe(true);
      }
    }
  });

  it('every multiple-choice answerIndex points to a real option', () => {
    for (const m of KEYS.flatMap(loadMissions)) {
      for (const q of m.exercises.multipleChoice) {
        expect(q.options[q.answerIndex]).toBeTruthy();
      }
    }
  });

  it('exercise counts are exactly 5 MC + 3 fill-blank + 2 matching', () => {
    for (const m of KEYS.flatMap(loadMissions)) {
      expect(m.exercises.multipleChoice).toHaveLength(5);
      expect(m.exercises.fillBlank).toHaveLength(3);
      expect(m.exercises.matching).toHaveLength(2);
    }
  });
});
