import { createBrowserClient } from '@supabase/ssr';

import { clientEnv } from '@/lib/env';

/**
 * Supabase browser client (scaffolding only — no auth logic yet, Sprint 3).
 * Use inside Client Components.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(clientEnv.supabaseUrl, clientEnv.supabaseAnonKey);
}
