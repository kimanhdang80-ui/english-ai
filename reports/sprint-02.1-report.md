# SPRINT 2.1 REPORT — Authentication Foundation

- **Epic:** 2 — Authentication
- **Sprint:** 2.1
- **Date:** 2026-07-01
- **Status:** ✅ Complete — typecheck, lint, build all green
- **Scope rule honored:** no Vocabulary/Grammar/AI/Lesson; no sample data beyond
  seeded roles/permissions; the one architecture change is analyzed in
  [ADR-0002](../docs/adr/ADR-0002.md).

---

## 1. What was completed

- **Supabase-Auth-centric identity model** + full **RBAC** schema (Prisma).
- **Auth flows** (Server Actions): sign up, login, logout, forgot password, reset
  password, email verification/resend, session refresh, `/auth/callback`.
- **Permission-based RBAC**: catalog, 4 roles, DB-driven access resolver, seed.
- **Route protection**: Edge middleware (authn) + Node `requirePermission` (authz).
- **Auth UI** per UI_GUIDELINE: Login, Register, Forgot, Reset, Verify, Profile,
  Settings, Admin; new `Card`/`Label`/`Alert` primitives.
- **Security**: rate limiting, CSRF (Server Actions), cookie strategy, zod env
  validation, audit logging.
- **Docs**: ADR-0002 + DATABASE/API/SYSTEM_ARCHITECTURE + state/changelog/next.

---

## 2. RBAC architecture

```
permissions (atomic  <resource>.<action>)
      ▲
      │ role_permissions (many-to-many)
      │
   roles  ── admin · teacher · content_manager · student
      ▲
      │ user_roles (many-to-many)
      │
  profiles (id = Supabase auth uid)
```

- **Never role-name checks.** Code asks `permissions.has('content.publish')`. Roles are
  seeded **data** (bundles of permissions), so they change without code edits
  ([ADR-0002](../docs/adr/ADR-0002.md), CLAUDE.md §9).
- **Catalog** lives in `src/lib/auth/permissions.ts` (single source, seeded to DB):
  - Student → self + read/submit lessons + read content.
  - Content Manager → + create/update/publish/delete content.
  - Teacher → + student progress read + feedback + author content.
  - Admin → **all** permissions (derived, not hand-listed).
- **Two-layer enforcement** (Edge can't use Prisma):
  1. `src/middleware.ts` — authentication gate on protected prefixes.
  2. `requireUser()` / `requirePermission()` — authorization in Node layouts
     (`/admin` requires `admin.panel_access`).

---

## 3. New database (Prisma → Supabase-Auth-centric)

Supabase owns `auth.users`; our `public` schema owns identity + RBAC.
**`profiles.id == auth.users.id`** (synced by trigger/webhook at deploy). 10 tables:

| Table                      | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `profiles`                 | App identity/profile (id = auth uid)                 |
| `roles`                    | Named permission bundles (data)                      |
| `permissions`              | Atomic `<resource>.<action>`                         |
| `role_permissions`         | role ↔ permission                                    |
| `user_roles`               | profile ↔ role                                       |
| `user_settings`            | Theme, locale, notification toggles                  |
| `user_devices`             | Devices/browsers (push + session context)            |
| `user_sessions`            | Session mirror (token **hash** only) for log-out-all |
| `audit_logs`               | Append-only security trail                           |
| `notification_preferences` | Per-channel, per-category opt-in                     |

- Enums added: `DevicePlatform`, `NotificationChannel`.
- **Removed** Sprint 1 `User`/`UserProfile`/`AuthAccount` (superseded by `profiles`).
- Validated (`prisma validate`) + client generated; a Prisma-generated SQL reference was
  produced via `migrate diff` (migrations apply in a DB environment — no local DB here).

---

## 4. New API / server surface

Auth is **Supabase Auth via Next Server Actions**, not hand-rolled REST
([API.md](../docs/API.md) §2). Surfaces added:

- Server Actions (`src/lib/auth/actions.ts`): `signUpAction`, `loginAction`,
  `logoutAction`, `forgotPasswordAction`, `resetPasswordAction`,
  `resendVerificationAction`.
- Route Handlers: `GET /auth/callback` (PKCE exchange), `GET /api/health` (now reports
  `config.supabase`/`config.database`).
- Middleware: `src/middleware.ts` (session refresh + auth gate).
- Server helpers: `getCurrentUser`, `requireUser`, `requirePermission`, `getUserAccess`.

---

## 5. New UI (per UI_GUIDELINE)

| Route              | Screen                                          |
| ------------------ | ----------------------------------------------- |
| `/login`           | Login form (redirect-aware)                     |
| `/register`        | Sign-up form                                    |
| `/forgot-password` | Request reset link                              |
| `/reset-password`  | Set new password                                |
| `/verify-email`    | Verify + resend                                 |
| `/profile`         | Read-only account details (protected)           |
| `/settings`        | Appearance + notifications scaffold (protected) |
| `/admin`           | RBAC overview (permission-gated)                |

- React 19 `useActionState` + `useFormStatus`; field + form-level validation feedback.
- New primitives: `Card`, `Label`, `Alert`; shared `SubmitButton`, `FormFeedback`.
- Auth route-group layout shows a **preview banner** when Supabase isn't configured, so
  the UI is a working mock without a backend.

---

## 6. Security decisions

- **Rate limiting** — sliding-window (`src/lib/security/rate-limit.ts`); presets: login
  5/min, sign-up 3/min, reset/resend 3/15min. In-memory default with a `RateLimitStore`
  interface to inject Redis/Upstash in production (documented; serverless memory isn't shared).
- **CSRF** — Next Server Actions are POST-only + Origin-checked (built-in). Callback
  validates a local-only `next` (no open redirect).
- **Cookies** — Supabase SSR (httpOnly, secure in prod, sameSite=lax); no tokens in JS.
- **Environment validation** — zod (`src/lib/env.ts`), **non-throwing** so build/dev
  succeed with placeholders; exposes `isSupabaseConfigured`/`isDatabaseConfigured` and an
  auth-path `assertAuthConfigured()`.
- **Audit** — every auth event → `audit_logs`.
- **Enumeration-safe** — forgot-password always returns success.

---

## 7. Key technical decisions

1. **Supabase owns auth; DB owns identity/RBAC** ([ADR-0002](../docs/adr/ADR-0002.md)) —
   removed duplicate `User`/`AuthAccount`, single source of truth for credentials.
2. **Permission-based authorization** — no role-name checks anywhere.
3. **Two-layer authn/authz** — Edge authn (no DB) + Node authz (Prisma).
4. **Graceful degradation** — no Supabase env ⇒ UI preview mode, not crashes; enables
   this sprint to ship + verify without a live backend.
5. **Added `zod`, `server-only`, `tsx`** — validation, server/client boundary
   enforcement, and the Prisma seed runner.

---

## 8. Verification

| Check       | Command                | Result                             |
| ----------- | ---------------------- | ---------------------------------- |
| Type safety | `npm run typecheck`    | ✅ 0 errors                        |
| Lint        | `npm run lint`         | ✅ 0 warnings/errors               |
| Format      | `npm run format:check` | ✅ clean                           |
| Build       | `npm run build`        | ✅ 14 routes + middleware compiled |
| Prisma      | `prisma validate`      | ✅ schema valid; client generated  |

Not run here (no DB/Docker in the environment): `prisma migrate`, `prisma:seed`, and
end-to-end auth against a live Supabase — these are Sprint 2.2's first tasks.

---

## 9. Next sprint (2.2)

Provision Supabase/Postgres → apply migrations + seed → Supabase↔`profiles` sync trigger

- default-role assignment → editable/persisted profile & settings → sessions/devices +
  log-out-everywhere → Vitest for RBAC/rate-limit/env in CI. See
  [NEXT_TASK.md](../docs/NEXT_TASK.md).
