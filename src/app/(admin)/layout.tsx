import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/auth/actions';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/session';

/**
 * Admin shell. Authorization is enforced here in the Node runtime via
 * `requirePermission` (middleware only checks authentication on the Edge).
 *
 * `force-dynamic`: admin pages read live, per-request data from the DB (prompt
 * templates/versions, generation history via `content_*`/`prompt_*`/`ai_generation_jobs`,
 * ADR-0005) and are permission-gated — they must never be statically prerendered.
 */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission(PERMISSIONS.ADMIN_PANEL_ACCESS, '/admin');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-muted/30">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">Admin</span>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to app
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
        <div className="container flex h-11 items-center gap-4 overflow-x-auto text-sm">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="container flex-1 py-8">{children}</main>
    </div>
  );
}

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/prompts', label: 'Prompt Library' },
  { href: '/admin/generator', label: 'Generator' },
  { href: '/admin/prompt-versions', label: 'Prompt Versions' },
  { href: '/admin/generation-history', label: 'Generation History' },
  { href: '/admin/ai-metrics', label: 'AI Metrics' },
] as const;
