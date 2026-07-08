import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
