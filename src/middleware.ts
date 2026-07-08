import { NextResponse, type NextRequest } from 'next/server';

import {
  DEFAULT_AUTHED_REDIRECT,
  isAuthPath,
  isProtectedPath,
} from '@/config/routes';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Global auth middleware:
 * 1. Refreshes the Supabase session (rotating cookies) on every matched request.
 * 2. Redirects unauthenticated users away from protected routes → /login.
 * 3. Redirects authenticated users away from auth routes → dashboard.
 *
 * Authorization (permissions/roles) is NOT done here (Edge runtime, no DB) — it lives
 * in Node-runtime layouts via requirePermission().
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = DEFAULT_AUTHED_REDIRECT;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
