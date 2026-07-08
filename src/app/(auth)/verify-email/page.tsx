import type { Metadata } from 'next';
import Link from 'next/link';

import { ResendVerificationForm } from '@/components/auth/resend-verification-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = { title: 'Verify email' };

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a verification link to your inbox. Click it to activate your
          account, then log in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t get the email? Check your spam folder or resend it below.
        </p>
        <ResendVerificationForm />
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
