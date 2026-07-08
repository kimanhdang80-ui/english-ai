import type { Metadata } from 'next';
import Link from 'next/link';

import { LearningPlayerShell } from '@/components/learn/learning-player-shell';

export const metadata: Metadata = { title: 'Learning Player' };

/** Learning Player — placeholder layout only (Sprint 3.1). */
export default async function LearningPlayerPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <div className="space-y-4">
      <Link
        href={`/learn/lessons/${lessonId}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Exit player
      </Link>
      <LearningPlayerShell
        stage={`Activity player for lesson ${lessonId} will run here.`}
      />
    </div>
  );
}
