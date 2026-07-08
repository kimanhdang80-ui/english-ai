import type { Metadata } from 'next';

import { ThemeToggle } from '@/components/theme-toggle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  await requireUser('/settings');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Preference management is scaffolded; persistence arrives in a later
          sprint.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how English AI looks.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Email and push preferences (coming soon).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification preferences will be editable once the notifications
            module ships.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
