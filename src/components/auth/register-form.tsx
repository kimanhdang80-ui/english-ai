'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { FieldError, FormFeedback } from '@/components/auth/form-feedback';
import { SubmitButton } from '@/components/auth/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpAction, type ActionState } from '@/lib/auth/actions';

const initial: ActionState = {};

export function RegisterForm() {
  const [state, formAction] = useActionState(signUpAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      <div className="space-y-2">
        <Label htmlFor="displayName">Name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          required
        />
        <FieldError state={state} field="displayName" />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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

      <SubmitButton className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
