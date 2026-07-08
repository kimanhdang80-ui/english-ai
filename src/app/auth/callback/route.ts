import { NextResponse, type NextRequest } from 'next/server';

import { isSupabaseConfigured } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * OAuth / email-link callback. Supabase redirects here with a `code` (PKCE) after
 * email verification, password recovery, or OAuth. We exchange it for a session
 * cookie, then forward to `next` (validated to be a local path).
 *
 * GET /auth/callback?code=...&next=/dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/dashboard';
  // Only allow local redirect targets (prevent open redirect).
  const next =
    nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/dashboard';

  if (code && isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Could not verify link. Please try again.')}`,
  );
}
