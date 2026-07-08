import 'server-only';

import { headers } from 'next/headers';

/** Best-effort client IP + user agent from request headers (for audit + rate limit). */
export async function getRequestContext(): Promise<{
  ip: string;
  userAgent: string;
}> {
  const h = await headers();
  const forwardedFor = h.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const userAgent = h.get('user-agent') ?? 'unknown';
  return { ip, userAgent };
}
