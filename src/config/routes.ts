/**
 * Route access policy consumed by middleware.
 *
 * Middleware runs on the Edge runtime and cannot use Prisma, so it enforces only
 * **authentication** (is there a session?). Fine-grained **authorization** (specific
 * permissions, e.g. admin) is enforced in Node-runtime layouts/pages via
 * `requirePermission()`. This two-layer model is intentional — see
 * SYSTEM_ARCHITECTURE.md §9.
 */

/** Prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = [
  '/dashboard',
  '/learn',
  '/vocabulary',
  '/review',
  '/progress',
  '/profile',
  '/settings',
  '/admin',
] as const;

/** Auth pages that a signed-in user should be bounced away from. */
export const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
] as const;

/** Where to send a signed-in user who hits an auth route. */
export const DEFAULT_AUTHED_REDIRECT = '/dashboard';

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
