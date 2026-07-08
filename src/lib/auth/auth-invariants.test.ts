import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ROLE,
  PERMISSION_DEFS,
  PERMISSIONS,
  ROLE_DEFS,
  ROLES,
} from './permissions';

/**
 * Offline guarantees for the auth wiring (RC-02). Runtime signup/login/etc. need a live
 * Supabase DB (verification matrix in AUTH_READY_REPORT.md); these lock the invariants the
 * `handle_new_user` trigger depends on, and assert the trigger migration exists + is well-formed.
 */
describe('auth invariants', () => {
  it('default role is "student" and is defined', () => {
    expect(DEFAULT_ROLE).toBe(ROLES.STUDENT);
    expect(ROLE_DEFS.some((r) => r.code === ROLES.STUDENT)).toBe(true);
  });

  it('the student role grants the learner self-service permission', () => {
    const student = ROLE_DEFS.find((r) => r.code === ROLES.STUDENT);
    expect(student?.permissions).toContain(PERMISSIONS.PROFILE_READ_SELF);
  });

  it('every role references only defined permissions', () => {
    const known = new Set(PERMISSION_DEFS.map((p) => p.code));
    for (const role of ROLE_DEFS) {
      for (const perm of role.permissions) {
        expect(known.has(perm)).toBe(true);
      }
    }
  });
});

describe('auth trigger migration (handle_new_user)', () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      'prisma',
      'migrations',
      '20260702000000_auth_user_sync',
      'migration.sql',
    ),
    'utf8',
  );

  it('creates the new-user function + trigger on auth.users', () => {
    expect(sql).toContain('FUNCTION public.handle_new_user()');
    expect(sql).toMatch(/CREATE TRIGGER on_auth_user_created/);
    expect(sql).toMatch(/AFTER INSERT ON auth\.users/);
    expect(sql).toContain('SECURITY DEFINER');
  });

  it('inserts a profile and assigns the default student role', () => {
    expect(sql).toMatch(/INSERT INTO public\.profiles/);
    expect(sql).toMatch(/INSERT INTO public\.user_roles/);
    expect(sql).toMatch(/code = 'student'/);
  });

  it('cleans up the profile on account deletion', () => {
    expect(sql).toContain('FUNCTION public.handle_user_delete()');
    expect(sql).toMatch(/AFTER DELETE ON auth\.users/);
    expect(sql).toMatch(/DELETE FROM public\.profiles/);
  });
});
