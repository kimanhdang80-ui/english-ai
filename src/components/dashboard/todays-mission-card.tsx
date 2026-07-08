import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Section 2 — Today's Mission: the ONE thing to do today. Shows the mission's parts
 * (new words, quiz) + estimated time and a single primary CTA. This card is the answer
 * to "what should I do today?" — no competing buttons.
 */
export function TodaysMissionCard({
  title,
  newWords,
  quizQuestions,
  estimatedMinutes,
  href,
}: {
  title: string;
  newWords: number;
  quizQuestions: number;
  estimatedMinutes: number;
  href: string;
}) {
  const parts = [
    { icon: '📖', label: `${newWords} new words` },
    { icon: '✍️', label: `${quizQuestions}-question quiz` },
    { icon: '🔁', label: 'Review' },
  ];

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Today&apos;s Mission
        </p>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="flex flex-wrap gap-2">
          {parts.map((p) => (
            <li
              key={p.label}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm"
            >
              <span aria-hidden="true">{p.icon}</span>
              {p.label}
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-muted-foreground">
            ⏱️ ~{estimatedMinutes} min
          </li>
        </ul>
        <Button asChild size="lg" className="w-full">
          <Link href={href}>Start today&apos;s lesson</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
