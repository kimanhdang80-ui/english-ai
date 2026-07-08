import type { Metadata } from 'next';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = { title: 'Reset password' };

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          Choose a strong password you don&apos;t use elsewhere.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
