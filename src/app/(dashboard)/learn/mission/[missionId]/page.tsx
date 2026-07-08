import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MissionFlowPlayer } from '@/components/mission/mission-flow-player';
import { getMissionById, nextMissionTitle } from '@/content/mission-loader';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Mission' };

/**
 * Complete mission flow (Task 05): Goal → Warmup → Vocabulary → Dialogue → Practice → Quiz →
 * Reflection → Summary → Review Queue. Content is loaded from the Mission Library (read-only);
 * no engine/DB/library change.
 */
export default async function MissionPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  await requireUser(`/learn/mission/${missionId}`);

  const mission = await getMissionById(missionId);
  if (!mission) notFound();

  const nextTitle = await nextMissionTitle(mission);

  return (
    <div className="space-y-6">
      <MissionFlowPlayer mission={mission} nextTitle={nextTitle} />
    </div>
  );
}
