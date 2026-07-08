import type { NextRequest } from 'next/server';

import { handleError, okPage } from '@/lib/http/response';
import { learning } from '@/modules/learning/infrastructure/container';
import { toPageQuery } from '@/modules/learning/domain/pagination';

/** GET /api/v1/courses?track=&status=&cefrLevelId=&page=&pageSize= */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = toPageQuery({
      page: sp.get('page'),
      pageSize: sp.get('pageSize'),
    });
    const result = await learning.courses.listCourses(
      {
        track: sp.get('track') ?? undefined,
        status: sp.get('status') ?? undefined,
        cefrLevelId: sp.get('cefrLevelId') ?? undefined,
      },
      page,
    );
    return okPage(result);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
