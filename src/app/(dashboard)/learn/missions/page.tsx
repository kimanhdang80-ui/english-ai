import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMissionById, listTracks } from '@/content/mission-loader';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Missions' };

/** Mission Library browser — pick a mission to run its full learning flow. */
export default async function MissionsPage() {
  await requireUser('/learn/missions');
  const tracks = await listTracks();
  const missionsByTrack = await Promise.all(
    tracks.map(async (track) => {
      const missions = (
        await Promise.all(track.missionIds.map((id) => getMissionById(id)))
      ).filter((m): m is NonNullable<typeof m> => m !== null);
      return { track, missions };
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Missions</h1>
        <p className="text-sm text-muted-foreground">
          Pick a mission — you&apos;ll warm up, learn, practice, quiz, and
          reflect in one short session.
        </p>
      </div>

      {missionsByTrack.map(({ track, missions }) => {
        return (
          <section key={track.key} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{track.title}</h2>
              <p className="text-sm text-muted-foreground">
                {track.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {missions.map((m, i) => (
                <Card key={m.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {i + 1}. {m.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {m.vocabulary.length} words · ~{m.estimatedMinutes} min ·{' '}
                      {m.difficulty}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/learn/mission/${m.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Start mission →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
