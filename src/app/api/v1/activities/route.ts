import type { NextRequest } from 'next/server';

import { handleError, ok, requireParam } from '@/lib/http/response';
import { learning } from '@/modules/learning/infrastructure/container';

/** GET /api/v1/activities?lessonVersionId= (activities belong to a lesson version) */
export async function GET(req: NextRequest) {
  try {
    const lessonVersionId = req.nextUrl.searchParams.get('lessonVersionId');
    const missing = requireParam(lessonVersionId, 'lessonVersionId');
    if (missing) return missing;

    const activities = await learning.lessons.listActivities(lessonVersionId!);
    return ok(activities);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
