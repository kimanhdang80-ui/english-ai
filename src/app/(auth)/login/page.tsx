import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to continue learning</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sp.error ? (
          <Alert variant="destructive">
            <AlertDescription>{sp.error}</AlertDescription>
          </Alert>
        ) : null}
        <LoginForm redirectTo={sp.redirectTo} />
      </CardContent>
    </Card>
  );
}
