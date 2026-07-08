import type { NextRequest } from 'next/server';

import { handleError, okPage } from '@/lib/http/response';
import { toPageQuery } from '@/modules/learning/domain/pagination';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

/** GET /api/v1/vocabularies?q=&cefrLevelId=&tag=&page=&pageSize= */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = toPageQuery({
      page: sp.get('page'),
      pageSize: sp.get('pageSize'),
    });
    const result = await vocabulary.catalog.listVocabularies(
      {
        search: sp.get('q') ?? undefined,
        cefrLevelId: sp.get('cefrLevelId') ?? undefined,
        tag: sp.get('tag') ?? undefined,
      },
      page,
    );
    return okPage(result);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
