import type { MissionContent } from '@/content/mission-schema';
import type {
  Exercise,
  Mission,
  MissionActivity,
  Question,
} from '@/modules/learning/domain/mission/entities';

/**
 * Maps a stored Mission Library document (`MissionContent`, Task 04) into the Mission
 * Engine's structural `Mission` (Task 03 domain). This is the seam that lets the engine
 * read the SAME authored content that the flow UI uses — from the DB, never fabricated.
 *
 * Study activities (vocabulary/dialogue/review) carry no exercises (they are read/recall
 * steps); the quiz activity carries the authored exercises (MC → multiple_choice,
 * fill → fill_blank, matching → match). Distractors live in the richer MissionContent
 * consumed by the flow UI; the engine's Question keeps only the answer key.
 */
export function missionContentToEngineMission(
  content: MissionContent,
  cefr: string,
): Mission {
  const activities: MissionActivity[] = [
    studyActivity(content.id, 'vocabulary', 'Vocabulary', 0),
    studyActivity(content.id, 'dialogue', 'Dialogue', 1),
    quizActivity(content),
    studyActivity(content.id, 'review', 'Review', 3),
  ];

  return {
    id: content.id,
    trackId: content.trackId,
    title: content.title,
    learningGoal: content.goal,
    cefr,
    difficulty: content.difficulty,
    estimatedMinutes: content.estimatedMinutes,
    activities,
    completionRule: {
      type: content.completionCriteria.type,
      minQuizScore: content.completionCriteria.minQuizScore,
    },
    sortOrder: content.order,
  };
}

function studyActivity(
  missionId: string,
  type: 'vocabulary' | 'dialogue' | 'review',
  title: string,
  sortOrder: number,
): MissionActivity {
  return {
    id: `${missionId}-${type}`,
    type,
    title,
    instructions: null,
    sortOrder,
    available: true,
    exercises: [],
  };
}

function quizActivity(content: MissionContent): MissionActivity {
  const { difficulty } = content;
  const exercises: Exercise[] = [
    {
      id: `${content.id}-quiz-mc`,
      type: 'multiple_choice',
      prompt: null,
      difficulty,
      questions: content.exercises.multipleChoice.map((q, i): Question => ({
        id: `${content.id}-mc-${i}`,
        prompt: q.prompt,
        answers: [
          {
            value: q.options[q.answerIndex] ?? '',
            isPrimary: true,
            matchMode: 'exact',
          },
        ],
        hint: null,
        explanation: q.explanation,
        difficulty,
      })),
    },
    {
      id: `${content.id}-quiz-fill`,
      type: 'fill_blank',
      prompt: null,
      difficulty,
      questions: content.exercises.fillBlank.map((q, i): Question => ({
        id: `${content.id}-fill-${i}`,
        prompt: q.prompt,
        answers: [{ value: q.answer, isPrimary: true, matchMode: 'ci' }],
        hint: { text: q.hint },
        explanation: q.explanation,
        difficulty,
      })),
    },
    {
      id: `${content.id}-quiz-match`,
      type: 'match',
      prompt: null,
      difficulty,
      questions: content.exercises.matching.flatMap((m, mi) =>
        m.pairs.map((p, pi): Question => ({
          id: `${content.id}-match-${mi}-${pi}`,
          prompt: p.left,
          answers: [{ value: p.right, isPrimary: true, matchMode: 'ci' }],
          hint: null,
          explanation: null,
          difficulty,
        })),
      ),
    },
  ];

  return {
    id: `${content.id}-quiz`,
    type: 'quiz',
    title: 'Quiz',
    instructions: null,
    sortOrder: 2,
    available: true,
    exercises,
  };
}
