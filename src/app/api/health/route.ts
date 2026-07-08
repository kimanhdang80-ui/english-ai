import { NextResponse } from 'next/server';

import { isDatabaseConfigured, isSupabaseConfigured } from '@/lib/env';

/**
 * Liveness/readiness probe used by Docker, Railway, and CI smoke tests.
 * GET /api/health
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'english-ai',
    timestamp: new Date().toISOString(),
    config: {
      supabase: isSupabaseConfigured,
      database: isDatabaseConfigured,
    },
  });
}
