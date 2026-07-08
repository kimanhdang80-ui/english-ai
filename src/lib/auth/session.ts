import 'server-only';

import { redirect } from 'next/navigation';

import { isSupabaseConfigured } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { getUserAccess, type AccessSnapshot } from './access';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  access: AccessSnapshot;
}

/**
 * Returns the current authenticated user (Supabase identity + app profile +
 * authorization snapshot), or `null` when signed out / unconfigured.
 * Read-only and safe to call from any Server Component.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profile, access] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { displayName: true, avatarUrl: true, email: true },
    }),
    getUserAccess(user.id),
  ]);

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    displayName: profile?.displayName ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    access,
  };
}

/** Require an authenticated user or redirect to login (with return path). */
export async function requireUser(returnTo?: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const query = returnTo ? `?redirectTo=${encodeURIComponent(returnTo)}` : '';
    redirect(`/login${query}`);
  }
  return user;
}

/**
 * Require a specific permission. Redirects to login if signed out, or to the
 * dashboard if authenticated but lacking the permission.
 */
export async function requirePermission(
  permission: string,
  returnTo?: string,
): Promise<AuthUser> {
  const user = await requireUser(returnTo);
  if (!user.access.permissions.has(permission)) {
    redirect('/dashboard?forbidden=1');
  }
  return user;
}
