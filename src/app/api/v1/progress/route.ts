import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, handleError } from '@/lib/http/response';
import { learning } from '@/modules/learning/infrastructure/container';

const progressSchema = z.object({
  lessonId: z.string().uuid(),
  activityId: z.string().uuid().optional(),
  exerciseId: z.string().uuid().optional(),
  questionId: z.string().uuid().optional(),
  outcome: z.enum(['started', 'completed', 'answered']),
  score: z.number().min(0).max(100).optional(),
});

/**
 * POST /api/v1/progress
 * Contract is fixed and validated; persistence is implemented in a later sprint,
 * so this returns 501 NOT_IMPLEMENTED (via ProgressService).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return fail(
        'VALIDATION_ERROR',
        'Invalid progress payload.',
        400,
        parsed.error.flatten().fieldErrors,
      );
    }
    await learning.progress.recordProgress(parsed.data);
    // recordProgress currently throws NotImplementedError → handled below.
    return fail(
      'NOT_IMPLEMENTED',
      'Progress recording is not available yet.',
      501,
    );
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
