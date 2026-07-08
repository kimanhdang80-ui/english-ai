import { NextResponse } from 'next/server';

import { ai } from '@/modules/ai/infrastructure/container';

/**
 * AI layer health probe. Reports provider config, circuit-breaker state, and recent
 * success/latency/cost from `ai_usage_logs`. Returns 503 only when the layer is actively
 * degraded (circuit open or low recent success rate) — `unconfigured` is a normal 200
 * (AI is optional; the app degrades to deterministic fallbacks). GET /api/health/ai
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const report = await ai.health.report(24);
  const httpStatus = report.status === 'degraded' ? 503 : 200;
  return NextResponse.json(report, { status: httpStatus });
}
