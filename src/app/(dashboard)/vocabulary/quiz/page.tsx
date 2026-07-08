import type { Metadata } from 'next';

import { QuizSession } from '@/components/vocabulary/quiz-session';
import { requireUser } from '@/lib/auth/session';
import { generateQuiz } from '@/modules/vocabulary/domain/quiz';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

export const metadata: Metadata = { title: 'Quiz' };

export default async function QuizPage() {
  await requireUser('/vocabulary/quiz');
  const items = await vocabulary.catalog.getQuizItems(20);
  const questions = generateQuiz(items, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vocabulary quiz</h1>
        <p className="text-sm text-muted-foreground">
          Multiple choice, fill in the blank, match, and true/false.
        </p>
      </div>
      <QuizSession questions={questions} />
    </div>
  );
}
