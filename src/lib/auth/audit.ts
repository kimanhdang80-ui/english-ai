import 'server-only';

import { isDatabaseConfigured } from '@/lib/env';
import { prisma } from '@/lib/prisma';

export interface AuditEntry {
  userId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append a security/audit event. Best-effort: auditing must never break the primary
 * flow, so failures are swallowed (and would be reported to the error tracker in prod).
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  if (!isDatabaseConfigured) return;
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata as object | undefined,
      },
    });
  } catch {
    // Intentionally swallowed — auditing is best-effort.
  }
}

/** Canonical audit action codes. */
export const AUDIT_ACTIONS = {
  SIGN_UP: 'auth.sign_up',
  LOGIN: 'auth.login',
  LOGIN_FAILED: 'auth.login_failed',
  LOGOUT: 'auth.logout',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'auth.password_reset_completed',
  EMAIL_VERIFICATION_SENT: 'auth.email_verification_sent',
  ROLE_ASSIGNED: 'role.assigned',
} as const;
