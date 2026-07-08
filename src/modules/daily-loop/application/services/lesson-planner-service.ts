import {
  ActivitySelector,
  GoalSelector,
  MissionSelector,
} from '@/modules/daily-loop/domain/planner-selectors';
import { RuleEngine } from '@/modules/daily-loop/domain/rule-engine';
import {
  estimateLessonMinutes,
  toLessonPlanView,
  type LessonPlan,
  type LessonPlanView,
  type PlanDecision,
} from '@/modules/daily-loop/domain/planning';

import type {
  LearnerProfilePort,
  LessonPlanRepository,
  LessonPlannerAiPort,
  ReviewSnapshotPort,
} from '@/modules/daily-loop/application/ports';

/**
 * Lesson Planner Service — orchestrates the daily generation pipeline (Learning Model V2):
 *
 *   1. Read the review queue + learner profile (real signals).
 *   2. Decide the lesson SHAPE — AI advisor if available, else the Rule Engine (fallback).
 *   3. Select Goal → Track → Mission → Activities from that decision.
 *   4. Assemble the LessonPlan (title, goal, estimated time, activities, completion criteria).
 *   5. Persist the plan ("Lưu Lesson Plan").
 *
 * The planner never invents content — words/quiz are materialized from the corpus later by
 * `DailyLessonService`. AI decides *which* mission/activities/difficulty; the Rule Engine is
 * the deterministic default and fallback (no mock, no randomness).
 */
export class LessonPlannerService {
  private readonly goals = new GoalSelector();
  private readonly missions = new MissionSelector();
  private readonly activities = new ActivitySelector();
  private readonly rules = new RuleEngine();

  constructor(
    private readonly reviews: ReviewSnapshotPort,
    private readonly profiles: LearnerProfilePort,
    private readonly plans: LessonPlanRepository,
    private readonly ai: LessonPlannerAiPort | null = null,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async planForUser(userId: string): Promise<LessonPlan> {
    const [snapshot, profileInfo] = await Promise.all([
      this.reviews.snapshot(userId),
      this.profiles.get(userId),
    ]);

    const goal = this.goals.select(profileInfo);
    const track = this.missions.track(goal);

    const decision = await this.decide({ review: snapshot, goal });

    const mission = this.missions.select(
      goal,
      track,
      snapshot,
      decision.newWordCount,
    );
    const activities = this.activities.select(decision, mission);
    const completionCriteria = this.activities.completionCriteria(decision);
    const estimatedMinutes = estimateLessonMinutes({
      newWords: decision.newWordCount,
      quiz: decision.quizCount,
      reviews: decision.reviewCount,
      includeDialogue: decision.newWordCount > 0,
    });

    const plan: LessonPlan = {
      date: this.clock().toISOString().slice(0, 10),
      goal,
      track,
      mission,
      strategy: decision.strategy,
      difficulty: decision.difficulty,
      activities,
      estimatedMinutes,
      completionCriteria,
      decidedBy: decision.decidedBy,
      rationale: decision.rationale,
    };

    await this.plans.save(userId, plan);
    return plan;
  }

  async planViewForUser(userId: string): Promise<LessonPlanView> {
    return toLessonPlanView(await this.planForUser(userId));
  }

  /** AI advisor decides structure; any absence/failure falls back to the Rule Engine. */
  private async decide(
    input: Parameters<RuleEngine['decide']>[0],
  ): Promise<PlanDecision> {
    if (this.ai?.configured) {
      try {
        const decided = await this.ai.decide(input);
        if (decided) return decided;
      } catch {
        // fall through to the deterministic rule engine
      }
    }
    return this.rules.decide(input);
  }
}
