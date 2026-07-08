import { handleError, ok } from '@/lib/http/response';
import { requireApiUser } from '@/lib/http/auth';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

/** GET /api/v1/reviews/today — the learner's due review cards. */
export async function GET() {
  try {
    const user = await requireApiUser();
    const cards = await vocabulary.learner.getTodayReviews(user.id);
    return ok(cards);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
