'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { FieldError, FormFeedback } from '@/components/auth/form-feedback';
import { SubmitButton } from '@/components/auth/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPasswordAction, type ActionState } from '@/lib/auth/actions';

const initial: ActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);
  const done = Boolean(state.success);

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      {done ? (
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
            />
            <FieldError state={state} field="password" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            <FieldError state={state} field="confirmPassword" />
          </div>

          <SubmitButton className="w-full" pendingText="Updating…">
            Update password
          </SubmitButton>
        </>
      )}
    </form>
  );
}
