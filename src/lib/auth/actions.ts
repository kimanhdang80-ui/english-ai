'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { assertAuthConfigured, clientEnv } from '@/lib/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getRequestContext } from '@/lib/security/request-context';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

import { AUDIT_ACTIONS, writeAuditLog } from './audit';

/**
 * Auth server actions. Server Actions are POST-only and Origin-checked by Next.js,
 * which provides CSRF protection out of the box (see SYSTEM_ARCHITECTURE.md §9).
 *
 * When Supabase is not configured, actions return a friendly error instead of
 * crashing, so the UI works as a mock end-to-end.
 */

export interface ActionState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
}

const emailSchema = z.string().email('Enter a valid email address.');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.');

function fieldErrors(error: z.ZodError): ActionState {
  return {
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}

function friendlyError(err: unknown): ActionState {
  if (err instanceof Error && err.name === 'AuthNotConfiguredError') {
    return {
      error:
        'Authentication backend is not connected yet. This is a UI preview (Supabase not configured).',
    };
  }
  return { error: 'Something went wrong. Please try again.' };
}

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1, 'Enter your name.').max(80),
});

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  try {
    assertAuthConfigured();
    const { ip, userAgent } = await getRequestContext();
    const limit = await rateLimit(`sign_up:${ip}`, RATE_LIMITS.SIGN_UP);
    if (!limit.success) {
      return { error: 'Too many attempts. Please try again later.' };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${clientEnv.appUrl}/auth/callback?next=/dashboard`,
        data: { display_name: parsed.data.displayName },
      },
    });
    if (error) return { error: error.message };

    await writeAuditLog({
      action: AUDIT_ACTIONS.SIGN_UP,
      ipAddress: ip,
      userAgent,
      metadata: { email: parsed.data.email },
    });
    return {
      success:
        'Account created. Check your email to verify your address before signing in.',
    };
  } catch (err) {
    return friendlyError(err);
  }
}

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
  redirectTo: z.string().optional(),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: formData.get('redirectTo') ?? undefined,
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  let redirectTarget = '/dashboard';
  try {
    assertAuthConfigured();
    const { ip, userAgent } = await getRequestContext();
    const limit = await rateLimit(`login:${ip}`, RATE_LIMITS.LOGIN);
    if (!limit.success) {
      return {
        error: 'Too many login attempts. Please try again in a minute.',
      };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      await writeAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        ipAddress: ip,
        userAgent,
        metadata: { email: parsed.data.email },
      });
      return { error: 'Invalid email or password.' };
    }

    await writeAuditLog({
      userId: data.user?.id,
      action: AUDIT_ACTIONS.LOGIN,
      ipAddress: ip,
      userAgent,
    });

    if (
      parsed.data.redirectTo &&
      parsed.data.redirectTo.startsWith('/') &&
      !parsed.data.redirectTo.startsWith('//')
    ) {
      redirectTarget = parsed.data.redirectTo;
    }
  } catch (err) {
    return friendlyError(err);
  }
  // redirect() throws — must run outside the try/catch.
  redirect(redirectTarget);
}

export async function logoutAction(): Promise<void> {
  try {
    assertAuthConfigured();
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    const { ip, userAgent } = await getRequestContext();
    await writeAuditLog({
      userId: user?.id,
      action: AUDIT_ACTIONS.LOGOUT,
      ipAddress: ip,
      userAgent,
    });
  } catch {
    // Ignore — always land the user on the login page.
  }
  redirect('/login');
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema })
    .safeParse({ email: formData.get('email') });
  if (!parsed.success) return fieldErrors(parsed.error);

  try {
    assertAuthConfigured();
    const { ip, userAgent } = await getRequestContext();
    const limit = await rateLimit(
      `password_reset:${ip}`,
      RATE_LIMITS.PASSWORD_RESET,
    );
    if (!limit.success) {
      return { error: 'Too many requests. Please try again later.' };
    }

    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${clientEnv.appUrl}/auth/callback?next=/reset-password`,
    });
    await writeAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      ipAddress: ip,
      userAgent,
      metadata: { email: parsed.data.email },
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AuthNotConfiguredError') {
      return friendlyError(err);
    }
    // Fall through — do not reveal whether the email exists.
  }
  // Always report success to avoid account enumeration.
  return {
    success:
      'If an account exists for that email, a password reset link is on its way.',
  };
}

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  try {
    assertAuthConfigured();
    // The user arrives here in a recovery session (via /auth/callback), so
    // updateUser applies to that session.
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) return { error: error.message };

    const { ip, userAgent } = await getRequestContext();
    await writeAuditLog({
      userId: data.user?.id,
      action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
      ipAddress: ip,
      userAgent,
    });
    return { success: 'Password updated. You can now sign in.' };
  } catch (err) {
    return friendlyError(err);
  }
}

export async function resendVerificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({ email: emailSchema })
    .safeParse({ email: formData.get('email') });
  if (!parsed.success) return fieldErrors(parsed.error);

  try {
    assertAuthConfigured();
    const { ip, userAgent } = await getRequestContext();
    const limit = await rateLimit(
      `email_resend:${ip}`,
      RATE_LIMITS.EMAIL_RESEND,
    );
    if (!limit.success) {
      return { error: 'Too many requests. Please try again later.' };
    }

    const supabase = await createSupabaseServerClient();
    await supabase.auth.resend({
      type: 'signup',
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${clientEnv.appUrl}/auth/callback?next=/dashboard`,
      },
    });
    await writeAuditLog({
      action: AUDIT_ACTIONS.EMAIL_VERIFICATION_SENT,
      ipAddress: ip,
      userAgent,
      metadata: { email: parsed.data.email },
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AuthNotConfiguredError') {
      return friendlyError(err);
    }
  }
  return {
    success: 'Verification email sent (if the account needs verifying).',
  };
}
