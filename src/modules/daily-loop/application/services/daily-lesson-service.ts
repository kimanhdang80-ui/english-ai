import type {
  DailyLesson,
  DailyLessonWord,
  DailyQuizQuestion,
} from '@/modules/daily-loop/domain/entities';
import {
  toLessonPlanView,
  type LessonPlan,
} from '@/modules/daily-loop/domain/planning';
import { generateQuiz, type QuizItem } from '@/modules/vocabulary/domain/quiz';

import type {
  ExplanationPort,
  LessonSourcePort,
} from '@/modules/daily-loop/application/ports';
import type { LessonPlannerService } from './lesson-planner-service';

/**
 * Materializes the day's lesson from a `LessonPlan` (Task 02 — Learning Model V2).
 *
 * The **planner** decides the shape (strategy, counts, mission); this service pulls the real
 * content from the corpus per that decision and attaches AI explanations. On review-focus
 * days (no new words) it materializes the study cards from the learner's due review set, so
 * the experience stays backward-compatible (the player always has content) — no mock content.
 */
export class DailyLessonService {
  constructor(
    private readonly planner: LessonPlannerService,
    private readonly source: LessonSourcePort,
    private readonly explanation: ExplanationPort,
  ) {}

  async buildForUser(userId: string): Promise<DailyLesson> {
    const plan = await this.planner.planForUser(userId);

    const items = await this.sourceItemsFor(userId, plan);
    const words: DailyLessonWord[] = items.map((i) => ({
      vocabularyId: i.id,
      word: i.word,
      definition: i.definition,
      example: i.exampleText ?? null,
    }));

    const quiz = await this.buildQuiz(
      items,
      plan.completionCriteria.quizToAnswer,
    );
    const due = await this.source.dueReview(userId);

    return {
      date: plan.date,
      words,
      quiz,
      reviewWord: due
        ? {
            vocabularyId: due.vocabulary.id,
            word: due.vocabulary.word,
            definition: due.vocabulary.meanings[0]?.definition ?? '',
            example: due.vocabulary.examples[0]?.text ?? null,
          }
        : null,
      reviewUserVocabularyId: due?.state.id ?? null,
      plan: toLessonPlanView(plan),
    };
  }

  /**
   * New words from the corpus for balanced/new-mission days; the due review set for
   * review-focus days (so the player has real content and the session matches the strategy).
   */
  private async sourceItemsFor(
    userId: string,
    plan: LessonPlan,
  ): Promise<QuizItem[]> {
    if (plan.strategy === 'review_focus') {
      const cards = await this.source.studySet(
        userId,
        Math.max(1, plan.completionCriteria.reviewsToClear),
      );
      return cards.map((c) => ({
        id: c.vocabulary.id,
        word: c.vocabulary.word,
        definition: c.vocabulary.meanings[0]?.definition ?? '',
        exampleText: c.vocabulary.examples[0]?.text ?? null,
      }));
    }
    return this.source.quizItems(plan.completionCriteria.wordsToStudy);
  }

  private async buildQuiz(
    items: QuizItem[],
    quizCount: number,
  ): Promise<DailyQuizQuestion[]> {
    const questions = generateQuiz(items, Math.max(1, quizCount));
    const byId = new Map(items.map((i) => [i.id, i]));

    return Promise.all(
      questions.map(async (q) => {
        let explanation = 'Review the words from this lesson.';
        const match = /^(?:mc|fb|tf)-(.+)$/.exec(q.id);
        const item = match ? byId.get(match[1] ?? '') : undefined;
        if (item) {
          const result = await this.explanation.explainWord({
            word: item.word,
            definition: item.definition,
            example: item.exampleText,
          });
          explanation = result.text;
        }
        return { ...q, explanation };
      }),
    );
  }
}
