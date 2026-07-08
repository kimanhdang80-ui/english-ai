import type { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROLE_DEFS } from '@/lib/auth/permissions';

export const metadata: Metadata = { title: 'Admin' };

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin console</h1>
        <p className="text-sm text-muted-foreground">
          Restricted to users with the{' '}
          <code className="text-xs">admin.panel_access</code> permission.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles &amp; permissions</CardTitle>
          <CardDescription>
            Seeded RBAC catalog (management UI arrives in a later sprint).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {ROLE_DEFS.map((role) => (
              <li key={role.code} className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {role.permissions.length} permissions
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {role.description}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
