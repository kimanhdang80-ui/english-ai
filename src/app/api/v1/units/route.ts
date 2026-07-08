import type { NextRequest } from 'next/server';

import { handleError, okPage } from '@/lib/http/response';
import { learning } from '@/modules/learning/infrastructure/container';
import { toPageQuery } from '@/modules/learning/domain/pagination';

/** GET /api/v1/units?courseId=&page=&pageSize= */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = toPageQuery({
      page: sp.get('page'),
      pageSize: sp.get('pageSize'),
    });
    const result = await learning.courses.listUnits(
      sp.get('courseId') ?? undefined,
      page,
    );
    return okPage(result);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
