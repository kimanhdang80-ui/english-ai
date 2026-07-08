import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { siteConfig } from '@/config/site';
import { isSupabaseConfigured } from '@/lib/env';

/** Shared shell for authentication pages (centered card). */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            {siteConfig.name}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="container flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm space-y-4">
          {!isSupabaseConfigured ? (
            <Alert variant="info">
              <AlertDescription>
                Preview mode — Supabase is not configured, so forms won&apos;t
                complete real authentication yet.
              </AlertDescription>
            </Alert>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
