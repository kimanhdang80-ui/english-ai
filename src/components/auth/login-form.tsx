'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { FieldError, FormFeedback } from '@/components/auth/form-feedback';
import { SubmitButton } from '@/components/auth/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type ActionState } from '@/lib/auth/actions';

const initial: ActionState = {};

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError state={state} field="password" />
      </div>

      <SubmitButton className="w-full" pendingText="Signing in…">
        Log in
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
