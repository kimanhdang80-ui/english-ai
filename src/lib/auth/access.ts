import 'server-only';

import { prisma } from '@/lib/prisma';

/** A user's authorization snapshot: role codes + a flat set of permission codes. */
export interface AccessSnapshot {
  roles: string[];
  permissions: Set<string>;
}

/**
 * Resolve a user's roles and effective permissions from the database.
 * Permissions are the union across all assigned roles.
 */
export async function getUserAccess(userId: string): Promise<AccessSnapshot> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          code: true,
          permissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      },
    },
  });

  const roles: string[] = [];
  const permissions = new Set<string>();

  for (const ur of userRoles) {
    roles.push(ur.role.code);
    for (const rp of ur.role.permissions) {
      permissions.add(rp.permission.code);
    }
  }

  return { roles, permissions };
}

export function hasPermission(
  access: AccessSnapshot,
  permission: string,
): boolean {
  return access.permissions.has(permission);
}

export function hasAnyPermission(
  access: AccessSnapshot,
  permissions: string[],
): boolean {
  return permissions.some((p) => access.permissions.has(p));
}
