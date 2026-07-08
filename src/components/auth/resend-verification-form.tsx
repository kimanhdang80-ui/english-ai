'use client';

import { useActionState } from 'react';

import { FieldError, FormFeedback } from '@/components/auth/form-feedback';
import { SubmitButton } from '@/components/auth/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resendVerificationAction, type ActionState } from '@/lib/auth/actions';

const initial: ActionState = {};

export function ResendVerificationForm() {
  const [state, formAction] = useActionState(resendVerificationAction, initial);

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

      <SubmitButton variant="outline" className="w-full" pendingText="Sending…">
        Resend verification email
      </SubmitButton>
    </form>
  );
}
