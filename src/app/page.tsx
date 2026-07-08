import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { siteConfig } from '@/config/site';

/** Minimal landing page (Sprint 1 placeholder — no marketing content yet). */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-lg font-bold">{siteConfig.name}</span>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
        <span className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Foundation · Sprint 1
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Learn English with your own AI teacher
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t">
        <div className="container flex h-14 items-center justify-center text-sm text-muted-foreground">
          © {siteConfig.name} — technical foundation
        </div>
      </footer>
    </div>
  );
}
