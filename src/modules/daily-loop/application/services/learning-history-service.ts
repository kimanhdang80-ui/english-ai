import type {
  DayActivity,
  LearningSession,
  LearningSessionInput,
} from '@/modules/daily-loop/domain/entities';

import type {
  ReviewActivityRepository,
  SessionRepository,
} from '@/modules/daily-loop/application/ports';

/**
 * Learning history: records a completed session (skeleton store) and surfaces recent
 * day-by-day activity (derived from review history — real, no new table).
 */
export class LearningHistoryService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly activity: ReviewActivityRepository,
    private readonly idFactory: () => string = () => crypto.randomUUID(),
  ) {}

  async recordSession(input: LearningSessionInput): Promise<LearningSession> {
    const session: LearningSession = { id: this.idFactory(), ...input };
    await this.sessions.append(session);
    return session;
  }

  listSessions(userId: string, limit = 20): Promise<LearningSession[]> {
    return this.sessions.list(userId, limit);
  }

  recentActivity(userId: string, days = 14): Promise<DayActivity[]> {
    return this.activity.recentActivity(userId, days);
  }
}
