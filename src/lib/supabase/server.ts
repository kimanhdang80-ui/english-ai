import { cookies } from 'next/headers';

import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { clientEnv } from '@/lib/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase server client (scaffolding only — no auth logic yet, Sprint 3).
 * Use inside Server Components, Route Handlers, and Server Actions.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // `setAll` called from a Server Component — safe to ignore when
          // middleware refreshes the session (wired up in Sprint 3).
        }
      },
    },
  });
}
