/**
 * RBAC catalog — the single source of truth for permissions and the default
 * role→permission mapping (CLAUDE.md §9).
 *
 * Design rules:
 * - Authorization is checked by **permission**, never by role name. Code must never
 *   do `if (role === 'admin')`. Roles are just labelled bundles of permissions,
 *   stored as DATA (seeded from this file) so they can evolve without code changes.
 * - Permission codes follow `<resource>.<action>`.
 */

export const PERMISSIONS = {
  // Account / self
  PROFILE_READ_SELF: 'profile.read_self',
  PROFILE_UPDATE_SELF: 'profile.update_self',
  SETTINGS_MANAGE_SELF: 'settings.manage_self',

  // Learning (surface reserved now; features arrive in later epics)
  LESSON_READ: 'lesson.read',
  LESSON_SUBMIT: 'lesson.submit',

  // Content authoring
  CONTENT_READ: 'content.read',
  CONTENT_CREATE: 'content.create',
  CONTENT_UPDATE: 'content.update',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_DELETE: 'content.delete',

  // Teaching
  STUDENT_PROGRESS_READ: 'student_progress.read',
  FEEDBACK_WRITE: 'feedback.write',

  // Administration
  USER_READ: 'user.read',
  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',
  AUDIT_READ: 'audit.read',
  ADMIN_PANEL_ACCESS: 'admin.panel_access',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDef {
  code: PermissionCode;
  resource: string;
  action: string;
  description: string;
}

/** Full permission definitions (seeded into `permissions`). */
export const PERMISSION_DEFS: PermissionDef[] = Object.values(PERMISSIONS).map(
  (code) => {
    const [resource, action] = code.split('.') as [string, string];
    return {
      code,
      resource,
      action,
      description: `${action.replace(/_/g, ' ')} on ${resource}`,
    };
  },
);

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  CONTENT_MANAGER: 'content_manager',
  STUDENT: 'student',
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export interface RoleDef {
  code: RoleCode;
  name: string;
  description: string;
  permissions: PermissionCode[];
}

const SELF_PERMISSIONS: PermissionCode[] = [
  PERMISSIONS.PROFILE_READ_SELF,
  PERMISSIONS.PROFILE_UPDATE_SELF,
  PERMISSIONS.SETTINGS_MANAGE_SELF,
];

const LEARNER_PERMISSIONS: PermissionCode[] = [
  ...SELF_PERMISSIONS,
  PERMISSIONS.LESSON_READ,
  PERMISSIONS.LESSON_SUBMIT,
  PERMISSIONS.CONTENT_READ,
];

/** Default role definitions (seeded into `roles` + `role_permissions`). */
export const ROLE_DEFS: RoleDef[] = [
  {
    code: ROLES.STUDENT,
    name: 'Student',
    description: 'Default learner. Can learn and manage their own account.',
    permissions: LEARNER_PERMISSIONS,
  },
  {
    code: ROLES.CONTENT_MANAGER,
    name: 'Content Manager',
    description: 'Authors and publishes learning content.',
    permissions: [
      ...LEARNER_PERMISSIONS,
      PERMISSIONS.CONTENT_CREATE,
      PERMISSIONS.CONTENT_UPDATE,
      PERMISSIONS.CONTENT_PUBLISH,
      PERMISSIONS.CONTENT_DELETE,
    ],
  },
  {
    code: ROLES.TEACHER,
    name: 'Teacher',
    description: 'Guides learners; reviews progress and gives feedback.',
    permissions: [
      ...LEARNER_PERMISSIONS,
      PERMISSIONS.CONTENT_CREATE,
      PERMISSIONS.CONTENT_UPDATE,
      PERMISSIONS.STUDENT_PROGRESS_READ,
      PERMISSIONS.FEEDBACK_WRITE,
    ],
  },
  {
    code: ROLES.ADMIN,
    name: 'Admin',
    description: 'Full administrative access.',
    // Admin gets every defined permission — derived, not hard-coded per item.
    permissions: Object.values(PERMISSIONS),
  },
];

/** The role assigned to a brand-new sign-up. */
export const DEFAULT_ROLE: RoleCode = ROLES.STUDENT;
