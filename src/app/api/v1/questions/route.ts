import type { NextRequest } from 'next/server';

import { handleError, ok, requireParam } from '@/lib/http/response';
import { learning } from '@/modules/learning/infrastructure/container';

/** GET /api/v1/questions?exerciseId= (includes choices; excludes answer key) */
export async function GET(req: NextRequest) {
  try {
    const exerciseId = req.nextUrl.searchParams.get('exerciseId');
    const missing = requireParam(exerciseId, 'exerciseId');
    if (missing) return missing;

    const questions = await learning.questions.listByExercise(exerciseId!);
    return ok(questions);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
