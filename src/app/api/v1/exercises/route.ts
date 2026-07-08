import type { NextRequest } from 'next/server';

import { handleError, ok, requireParam } from '@/lib/http/response';
import { learning } from '@/modules/learning/infrastructure/container';

/** GET /api/v1/exercises?activityId= */
export async function GET(req: NextRequest) {
  try {
    const activityId = req.nextUrl.searchParams.get('activityId');
    const missing = requireParam(activityId, 'activityId');
    if (missing) return missing;

    const exercises = await learning.exercises.listByActivity(activityId!);
    return ok(exercises);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
