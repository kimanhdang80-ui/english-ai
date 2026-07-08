import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { logoutAction } from '@/lib/auth/actions';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/learn/today', label: 'Today' },
  { href: '/learn/missions', label: 'Missions' },
  { href: '/vocabulary', label: 'Vocabulary' },
  { href: '/review', label: 'Review' },
  { href: '/progress', label: 'Progress' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
] as const;

/** Authenticated shell. `requireUser` redirects to /login when signed out. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const canSeeAdmin = user.access.permissions.has(
    PERMISSIONS.ADMIN_PANEL_ACCESS,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold">
              {siteConfig.name}
            </Link>
            <nav className="hidden items-center gap-4 sm:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              {canSeeAdmin ? (
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-8">{children}</main>
    </div>
  );
}
