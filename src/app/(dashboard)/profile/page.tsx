import type { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await requireUser('/profile');

  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: user.displayName ?? '—' },
    { label: 'Email', value: user.email ?? '—' },
    { label: 'Roles', value: user.access.roles.join(', ') || '—' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your account details. Editing arrives in a later sprint.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Read-only for now.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-3"
              >
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                <dd className="text-sm font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
