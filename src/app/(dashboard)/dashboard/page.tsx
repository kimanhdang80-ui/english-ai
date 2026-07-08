import type { Metadata } from 'next';

import { AiCoachCard } from '@/components/dashboard/ai-coach-card';
import { GreetingHeader } from '@/components/dashboard/greeting-header';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { TodaysMissionCard } from '@/components/dashboard/todays-mission-card';
import { TodaysReviewCard } from '@/components/dashboard/todays-review-card';
import {
  WeakWordsCard,
  type WeakWord,
} from '@/components/dashboard/weak-words-card';
import { WeeklyProgressChart } from '@/components/dashboard/weekly-progress-chart';
import { buildCoachMessage } from '@/lib/dashboard/coach-message';
import { requireUser } from '@/lib/auth/session';
import { dailyLoop } from '@/modules/daily-loop/infrastructure/container';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Learning Dashboard — answers one question: "what should I do today?".
 * Order: Greeting → Today's Mission → Today's Review → AI Coach → Weekly Progress →
 * Weak Words → Recent Activity. No stats-only widgets, no Continue Learning / Quick Actions.
 *
 * Reads only existing services (no DB/API change). It deliberately does NOT build the full
 * daily lesson here (that triggers AI) — the mission summary uses the fixed lesson plan,
 * matching `DailyLessonService` defaults (10 words + 5 quiz).
 */
const MISSION = { newWords: 10, quizQuestions: 5, estimatedMinutes: 12 };

export default async function DashboardPage() {
  const user = await requireUser('/dashboard');

  const [stats, queue, streak, week, sessions] = await Promise.all([
    vocabulary.learner.getStats(user.id),
    dailyLoop.reviewQueue.getQueue(user.id),
    dailyLoop.streak.forUser(user.id),
    dailyLoop.history.recentActivity(user.id, 7),
    dailyLoop.history.listSessions(user.id, 1),
  ]);

  // Weak words = words still being built (not yet mastered), from the review queue.
  const weakWords: WeakWord[] = queue.items
    .filter((i) => i.status === 'learning' || i.status === 'review')
    .slice(0, 5)
    .map((i) => ({ word: i.word, status: i.status }));

  const coach = buildCoachMessage({
    displayName: user.displayName,
    streak: streak.current,
    dueNow: queue.dueNow,
    totalWords: stats.totalWords,
    topWeakWord: weakWords[0]?.word ?? null,
  });

  const hour = new Date().getHours();
  const lastSession = sessions[0] ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* 1 — Greeting */}
      <GreetingHeader
        displayName={user.displayName}
        hour={hour}
        streak={streak.current}
        dueNow={queue.dueNow}
      />

      {/* 2 — Today's Mission (the one thing to do) */}
      <TodaysMissionCard
        title="Everyday English · A1 Basics"
        newWords={MISSION.newWords}
        quizQuestions={MISSION.quizQuestions}
        estimatedMinutes={MISSION.estimatedMinutes}
        href="/learn/today"
      />

      {/* 3 — Today's Review · 4 — AI Coach */}
      <div className="grid gap-6 md:grid-cols-2">
        <TodaysReviewCard
          needReview={queue.dueNow}
          mastered={queue.byStatus.mastered}
        />
        <AiCoachCard message={coach} />
      </div>

      {/* 5 — Weekly Progress */}
      <WeeklyProgressChart days={week} />

      {/* 6 — Weak Words · 7 — Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <WeakWordsCard words={weakWords} />
        <RecentActivityCard session={lastSession} />
      </div>
    </div>
  );
}
