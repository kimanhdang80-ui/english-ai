import type { NextRequest } from 'next/server';

import { handleError, ok } from '@/lib/http/response';
import { vocabulary } from '@/modules/vocabulary/infrastructure/container';

/** GET /api/v1/vocabularies/:id — full word entry. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const word = await vocabulary.catalog.getVocabulary(id);
    return ok(word);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
