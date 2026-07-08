import 'server-only';

import { prisma } from '@/lib/prisma';

import { MissionPlanner } from '@/modules/learning/application/mission/mission-planner';
import { MissionService } from '@/modules/learning/application/mission/mission-service';

import { PrismaMissionRepository } from './prisma-mission-repository';
import { PrismaUserProgressRepository } from './prisma-user-progress-repository';

/**
 * Composition root for the Mission Engine (Learning Model V2). RC-03: wired over Prisma
 * stores — missions come from the Mission Library in the DB (`content_missions`) and
 * progress persists in `mission_progress` (ADR-0005). No in-memory stores remain in the
 * runtime. Exposed separately from the legacy `learning` container so the old Lesson
 * engine is untouched (backward compatible).
 */
const missionRepo = new PrismaMissionRepository(prisma);
const progressRepo = new PrismaUserProgressRepository(prisma);
const planner = new MissionPlanner(missionRepo);

export const missionEngine = {
  missions: new MissionService(missionRepo, planner, progressRepo),
  planner,
  repository: missionRepo,
  progress: progressRepo,
};

export type MissionEngineContainer = typeof missionEngine;
