import type { Metadata } from 'next';

import { DailyLessonPlayer } from '@/components/daily/daily-lesson-player';
import { requireUser } from '@/lib/auth/session';
import { dailyLoop } from '@/modules/daily-loop/infrastructure/container';

export const metadata: Metadata = { title: "Today's Lesson" };

/** Today's lesson — the daily learning loop (study → quiz → results). */
export default async function TodaysLessonPage() {
  const user = await requireUser('/learn/today');
  const lesson = await dailyLoop.lesson.buildForUser(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today&apos;s lesson</h1>
        <p className="text-sm text-muted-foreground">
          Learn {lesson.words.length} words, then take a short quiz.
        </p>
      </div>
      <DailyLessonPlayer lesson={lesson} />
    </div>
  );
}
