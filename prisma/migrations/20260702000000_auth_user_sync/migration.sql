-- RC-02 · Auth production wiring (ADR-0004)
-- Sync Supabase auth.users → public.profiles → public.user_roles, and clean up on delete.
-- Idempotent + SECURITY DEFINER. Rollback: see docs/adr/ADR-0004.md §Rollback.

-- ── On sign-up: create the profile + assign the default 'student' role ──────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- 1) Profile (id EQUALS auth.users.id — ADR-0002). display_name comes from sign-up metadata.
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2) Default role = 'student' (seeded in public.roles). No-op if roles aren't seeded yet.
  SELECT id INTO v_role_id FROM public.roles WHERE code = 'student' LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (id, user_id, role_id, created_at)
    VALUES (gen_random_uuid(), NEW.id, v_role_id, now())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── On delete: remove the profile (cascades to owned rows; audit/AI logs SetNull) ──
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
