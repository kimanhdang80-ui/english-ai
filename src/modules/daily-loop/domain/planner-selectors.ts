import {
  GOAL_LABELS,
  TIME_COST,
  estimateLessonMinutes,
  type CompletionCriteria,
  type DailyGoal,
  type LearnerProfileInfo,
  type LearningTrack,
  type Mission,
  type PlanDecision,
  type PlannedActivity,
  type ReviewSnapshot,
} from './planning';

const DEFAULT_CEFR = 'A1';
const DEFAULT_MINUTES = 15;

/**
 * Goal Selector — derives today's `DailyGoal` from the learner's real profile
 * (learning goal + CEFR + daily-minutes budget), with safe defaults for new learners.
 * Pure; no content.
 */
export class GoalSelector {
  select(profile: LearnerProfileInfo): DailyGoal {
    const cefr = profile.cefr?.trim() || DEFAULT_CEFR;
    const dailyMinutes =
      profile.dailyMinutes > 0 ? profile.dailyMinutes : DEFAULT_MINUTES;
    return {
      kind: profile.goal,
      label: GOAL_LABELS[profile.goal],
      dailyMinutes,
      cefr,
    };
  }
}

/**
 * Mission Selector — derives today's Track + Mission from the learner's goal and progress.
 *
 * A Track is the goal×CEFR lane; a Mission is the next coherent set of new words within it.
 * The "set index" is derived deterministically from how many words the learner already has
 * (`review.total`) so missions advance as the learner progresses — no randomness, no
 * hard-coded curriculum (the actual words are pulled from the corpus at materialization).
 */
export class MissionSelector {
  track(goal: DailyGoal): LearningTrack {
    return {
      id: `${goal.kind}-${goal.cefr.toLowerCase()}`,
      title: `${goal.label} · ${goal.cefr}`,
      goal: goal.kind,
      cefr: goal.cefr,
    };
  }

  /**
   * Returns the next mission, or `null` when there are no new words to teach today
   * (review-focus days). `newWordCount` comes from the Rule Engine / AI decision.
   */
  select(
    goal: DailyGoal,
    track: LearningTrack,
    review: ReviewSnapshot,
    newWordCount: number,
  ): Mission | null {
    if (newWordCount <= 0) return null;

    const setIndex = Math.floor(review.total / newWordCount) + 1;
    return {
      id: `${track.id}-set-${setIndex}`,
      trackId: track.id,
      title: `${goal.label} · ${goal.cefr} — Set ${setIndex}`,
      learningGoal: `Learn ${newWordCount} new ${goal.cefr} words you can use today.`,
      cefr: goal.cefr,
      newWordCount,
      estimatedMinutes: estimateLessonMinutes({
        newWords: newWordCount,
        quiz: 0,
        reviews: 0,
        includeDialogue: true,
      }),
    };
  }
}

/**
 * Activity Selector — turns a decision (+ mission) into the ordered activity list of the
 * lesson (Vocabulary → Dialogue → Quiz → Review), each with item counts and estimated time.
 *
 * Dialogue is **planned** by the algorithm but marked `available: false` until dialogue
 * content exists — the planner never fabricates content (no mock).
 */
export class ActivitySelector {
  select(decision: PlanDecision, mission: Mission | null): PlannedActivity[] {
    const activities: PlannedActivity[] = [];

    if (decision.newWordCount > 0 && mission) {
      activities.push({
        kind: 'vocabulary',
        skill: 'vocabulary',
        title: `Learn ${decision.newWordCount} new words`,
        itemCount: decision.newWordCount,
        estimatedMinutes: Math.max(
          1,
          Math.ceil(decision.newWordCount * TIME_COST.perNewWord),
        ),
        available: true,
      });
      activities.push({
        kind: 'dialogue',
        skill: 'dialogue',
        title: 'Practice a short dialogue',
        itemCount: 1,
        estimatedMinutes: TIME_COST.dialogue,
        available: false, // planned; no dialogue content yet
      });
    }

    if (decision.quizCount > 0) {
      activities.push({
        kind: 'quiz',
        skill: 'quiz',
        title: `Answer ${decision.quizCount} quiz questions`,
        itemCount: decision.quizCount,
        estimatedMinutes: Math.max(
          1,
          Math.ceil(decision.quizCount * TIME_COST.perQuiz),
        ),
        available: true,
      });
    }

    if (decision.reviewCount > 0) {
      activities.push({
        kind: 'review',
        skill: 'review',
        title: `Review ${decision.reviewCount} due words`,
        itemCount: decision.reviewCount,
        estimatedMinutes: Math.max(
          1,
          Math.ceil(decision.reviewCount * TIME_COST.perReview),
        ),
        available: true,
      });
    }

    return activities;
  }

  completionCriteria(decision: PlanDecision): CompletionCriteria {
    const parts: string[] = [];
    if (decision.newWordCount > 0)
      parts.push(`study ${decision.newWordCount} words`);
    if (decision.quizCount > 0)
      parts.push(`answer ${decision.quizCount} quiz questions`);
    if (decision.reviewCount > 0)
      parts.push(`review ${decision.reviewCount} words`);
    return {
      wordsToStudy: decision.newWordCount,
      quizToAnswer: decision.quizCount,
      reviewsToClear: decision.reviewCount,
      summary:
        parts.length > 0
          ? `Complete when you ${parts.join(', ')}.`
          : 'Nothing due today — you are all caught up.',
    };
  }
}
