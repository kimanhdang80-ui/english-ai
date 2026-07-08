import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { fail, handleError, ok } from '@/lib/http/response';
import { requireApiUser } from '@/lib/http/auth';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

const bodySchema = z
  .object({
    rating: z.enum(['again', 'hard', 'good', 'easy']).optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((b) => b.rating !== undefined || b.isFavorite !== undefined, {
    message: 'Provide a rating and/or isFavorite.',
  });

/**
 * PATCH /api/v1/user-vocabulary/:id
 * Apply a review grade (SRS) and/or toggle favorite. Returns the updated state.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return fail('VALIDATION_ERROR', 'Invalid payload.', 400);
    }

    let state;
    if (parsed.data.rating) {
      state = await vocabulary.learner.review(user.id, id, parsed.data.rating);
    }
    if (parsed.data.isFavorite !== undefined) {
      state = await vocabulary.learner.setFavorite(
        user.id,
        id,
        parsed.data.isFavorite,
      );
    }
    return ok(state);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
