import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, handleError, ok } from '@/lib/http/response';
import { requireApiUser } from '@/lib/http/auth';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

const bodySchema = z.object({ vocabularyId: z.string().uuid() });

/** POST /api/v1/user-vocabulary — add a word to the learner's set (idempotent). */
export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid payload.', 400);
    }
    const state = await vocabulary.learner.addToLearning(
      user.id,
      parsed.data.vocabularyId,
    );
    return ok(state, 201);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
