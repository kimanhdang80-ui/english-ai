import { NextResponse, type NextRequest } from 'next/server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { clientEnv, isSupabaseConfigured } from '@/lib/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase session on every request and returns both the (possibly
 * cookie-updated) response and the current user. Edge-runtime safe: no Prisma here.
 *
 * When Supabase is not configured (placeholder env), returns `user: null` without
 * making a network call so local/dev builds behave predictably.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: { id: string; email?: string } | null;
}> {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    return { response, user: null };
  }

  const supabase = createServerClient(
    clientEnv.supabaseUrl,
    clientEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: getUser() revalidates the token with Supabase (do not trust getSession
  // in middleware). Failures degrade to "no user" rather than throwing.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return {
      response,
      user: user ? { id: user.id, email: user.email ?? undefined } : null,
    };
  } catch {
    return { response, user: null };
  }
}
