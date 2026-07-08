'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { FieldError, FormFeedback } from '@/components/auth/form-feedback';
import { SubmitButton } from '@/components/auth/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordAction, type ActionState } from '@/lib/auth/actions';

const initial: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <FieldError state={state} field="email" />
      </div>

      <SubmitButton className="w-full" pendingText="Sending…">
        Send reset link
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
