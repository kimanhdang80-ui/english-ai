import type { Metadata } from 'next';
import Link from 'next/link';

import {
  EmptyState,
  LearnPlaceholder,
} from '@/components/learn/learn-placeholder';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Lesson' };

/** Lesson Detail — placeholder layout only (Sprint 3.1). */
export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  return (
    <LearnPlaceholder
      title="Lesson"
      description="Lesson overview, objectives, and activities will appear here."
      breadcrumb={
        <Link href="/learn" className="hover:text-foreground">
          ← Courses
        </Link>
      }
    >
      <p className="text-xs text-muted-foreground">Lesson ID: {lessonId}</p>
      <EmptyState title="No activities yet" />
      <Button asChild>
        <Link href={`/learn/lessons/${lessonId}/play`}>Start lesson</Link>
      </Button>
    </LearnPlaceholder>
  );
}
