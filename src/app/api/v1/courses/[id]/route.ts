import type { NextRequest } from 'next/server';

import { handleError, ok } from '@/lib/http/response';
import { learning } from '@/modules/learning/infrastructure/container';

/** GET /api/v1/courses/:id */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const course = await learning.courses.getCourse(id);
    return ok(course);
  } catch (err) {
    return handleError(err);
  }
}

export const dynamic = 'force-dynamic';
