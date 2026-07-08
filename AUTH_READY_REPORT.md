# AUTH_READY_REPORT.md — RC-02 Auth Production Ready

> Role: Principal Backend Engineer. Goal: make Authentication production-ready. No new feature,
> no UI/UX change. Read: [PRODUCTION_AUDIT.md](./PRODUCTION_AUDIT.md),
> [DATABASE_READY_REPORT.md](./DATABASE_READY_REPORT.md), [PROJECT_STATE.md](./docs/PROJECT_STATE.md).
> Decision: [docs/adr/ADR-0004.md](./docs/adr/ADR-0004.md). Date: 2026-07-02.

---

## 0. Summary

The one production-blocking gap in auth (PA-C2 / DEBT-008) is **closed in code**: a Supabase→app
identity **trigger** now creates the `profiles` row and assigns the default **`student`** role on
every sign-up, and cleans the profile up on account deletion. All other links in the chain already
existed and were verified. **No application code, UI, or UX changed** — the trigger fills the gap
`signUpAction`/`getCurrentUser` already assumed.

Because this environment has **no live Supabase/Postgres** (see DATABASE_READY_REPORT), the runtime
auth flows can't be executed here; the trigger is delivered as a **migration** with a rollback and an
offline test, plus a deploy-time verification matrix (§4).

## 1. Auth chain review

| Link               | Before                        | Now                                                            | Where                                                                     |
| ------------------ | ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Supabase Auth**  | ✅                            | ✅                                                             | `src/lib/supabase/{client,server,middleware}.ts`                          |
| **profiles**       | ❌ not created on sign-up     | ✅ **created by `handle_new_user`**                            | migration `20260702000000_auth_user_sync`                                 |
| **user_roles**     | ❌ no role assigned           | ✅ **default `student` assigned by trigger**                   | same migration + `DEFAULT_ROLE`                                           |
| **permission**     | ✅ (but empty w/o roles)      | ✅ now populated                                               | `src/lib/auth/access.ts` (`getUserAccess`)                                |
| **session**        | ✅                            | ✅                                                             | Supabase SSR cookies (`server.ts`, `middleware.ts`)                       |
| **refresh**        | ✅                            | ✅                                                             | `updateSession` → `supabase.auth.getUser()` revalidates token per request |
| **logout**         | ✅                            | ✅                                                             | `logoutAction` (`src/lib/auth/actions.ts`)                                |
| **delete account** | ❌ orphaned profile on delete | ✅ **data-layer teardown** via `handle_user_delete` (cascades) | same migration                                                            |

**Implemented this task:** the two triggers (new-user sync + delete cleanup). Everything else was
present and is confirmed correct.

## 2. What was built (no feature / no UI / no UX)

- **Migration** `prisma/migrations/20260702000000_auth_user_sync/migration.sql`:
  - `handle_new_user()` — `AFTER INSERT ON auth.users`: insert `profiles` (id = auth id, email,
    `display_name` from sign-up metadata) + assign `student` role; `SECURITY DEFINER`, idempotent
    (`ON CONFLICT DO NOTHING`).
  - `handle_user_delete()` — `AFTER DELETE ON auth.users`: delete the profile → cascades to owned
    rows (user_roles, user_vocabulary, review_history, …); audit/AI logs SetNull.
- **ADR-0004** (DB gate): context, decision, impact, migration + **backfill**, **rollback**, alternatives.
- **Offline test** `src/lib/auth/auth-invariants.test.ts` (6 tests): default role = `student`,
  role/permission integrity, and the trigger migration exists + inserts profile/user_roles/`student`
  - deletes profile on account removal.

**No changes** to any component, route, server action, or the Prisma schema (the triggers are raw
SQL on the Supabase `auth` schema).

## 3. Gates

| Gate                     | Result                                           |
| ------------------------ | ------------------------------------------------ |
| `npm run typecheck`      | ✅ pass                                          |
| `npm run lint`           | ✅ no warnings                                   |
| `npm run test`           | ✅ **133** passed (+6 auth invariants/migration) |
| `npm run build`          | ✅ compiled + 26/26 pages                        |
| `prisma validate`        | ✅ valid                                         |
| `prisma migrate` (apply) | ⛔ deploy-time — no DB in this environment       |

## 4. Testing matrix (deploy-time — needs live Supabase + DB)

Runtime auth can't be exercised without a provisioned Supabase project. After
`prisma migrate deploy` + `prisma:seed` (roles) + this migration:

| Test           | Steps                                   | Expected                                                                                              |
| -------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Signup**     | Register a new email                    | `auth.users` row → trigger → `profiles` row (id=auth id, display_name set) + `user_roles` = `student` |
| **Login**      | Sign in                                 | Session cookie set; `getCurrentUser` returns profile + `permissions` non-empty                        |
| **Logout**     | `logoutAction`                          | Session cleared; protected routes redirect to `/login`                                                |
| **Refresh**    | Wait past access-token TTL, navigate    | `updateSession`/`getUser` refreshes silently; no logout                                               |
| **Permission** | Visit `/admin` as student               | Redirect `/dashboard?forbidden=1`; grant `admin` role → access allowed                                |
| **Delete**     | Delete the `auth.users` row (admin/API) | `handle_user_delete` removes the profile; owned rows cascade; audit/AI logs SetNull                   |
| **Backfill**   | For users created pre-trigger           | Run ADR-0004 backfill → each gets a profile + `student` role                                          |

## 5. Scope notes

- **Self-service "delete my account" UI/endpoint is intentionally NOT added** (that's a product
  feature; RC-02 forbids new features/UI). The **data layer** now supports clean deletion — a future
  feature can call Supabase admin `deleteUser` and rely on `handle_user_delete`.
- The trigger reads `raw_user_meta_data->>'display_name'`, which `signUpAction` already sets — so no
  code change was needed there.
- Roles must be seeded (`prisma:seed`) before sign-ups; the role lookup no-ops safely otherwise, and
  the ADR includes a backfill for any pre-trigger users.

## 6. Verdict

**Authentication is production-ready in code.** The identity-sync gap that made real sign-ups
unusable is closed via ADR-0004's triggers (with rollback + backfill + offline tests). The only
remaining step is **operational**: apply the migration on a provisioned Supabase/Postgres and run
the §4 matrix. Auth moves from 🔴 (blocked) to 🟢 pending provisioning.
