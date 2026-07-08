import 'server-only';

import { UnauthorizedError } from '@/lib/errors';
import { getCurrentUser, type AuthUser } from '@/lib/auth/session';

/** Require an authenticated user in a Route Handler, or throw (→ 401 via handleError). */
export async function requireApiUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
