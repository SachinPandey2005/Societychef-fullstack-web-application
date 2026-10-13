-- Migration: 20260920000002_prevent_profile_role_escalation.sql
-- Description: Blocks self-service privilege escalation on public.profiles.
--
-- 004_rls_and_live_readiness.sql grants "Users update own profile" using only
-- `auth.uid() = id` — it restricts which ROW a user can touch, but not which
-- COLUMNS. That means any authenticated client can currently run
--   supabase.from('profiles').update({ role: 'admin', active_role: 'admin' }).eq('id', myId)
-- directly, using nothing but their own session, and grant themselves admin/ops
-- access. This is the same UI surface removed in app/(auth)/role.tsx (the
-- "Platform Admin (CRM)" self-select card) — but removing the UI card alone does
-- not stop a direct API/database call, so the real fix has to live here.
--
-- This trigger blocks any INSERT/UPDATE that sets role, active_role or roles to
-- an elevated value (ops/admin/SUPER_ADMIN), or that changes an existing elevated
-- value, UNLESS the acting user is already ops/admin/SUPER_ADMIN, or the write
-- comes from the backend's service role (which bypasses this entirely and is used
-- for any legitimate admin-provisioning flow going forward).

CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_role text;
  wants_elevated boolean;
  had_elevated boolean;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  wants_elevated := (NEW.role IN ('ops', 'admin', 'SUPER_ADMIN'))
    OR (NEW.active_role IN ('ops', 'admin', 'SUPER_ADMIN'))
    OR (NEW.roles IS NOT NULL AND NEW.roles && ARRAY['ops', 'admin', 'SUPER_ADMIN']::text[]);

  had_elevated := TG_OP = 'UPDATE' AND (
    OLD.role IN ('ops', 'admin', 'SUPER_ADMIN')
    OR OLD.active_role IN ('ops', 'admin', 'SUPER_ADMIN')
    OR (OLD.roles IS NOT NULL AND OLD.roles && ARRAY['ops', 'admin', 'SUPER_ADMIN']::text[])
  );

  IF wants_elevated OR had_elevated THEN
    SELECT role INTO acting_role FROM public.profiles WHERE id = auth.uid();
    IF acting_role IS NULL OR acting_role NOT IN ('ops', 'admin', 'SUPER_ADMIN') THEN
      RAISE EXCEPTION 'Not permitted: elevated roles can only be granted or changed by an existing ops/admin account.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- To provision the first real admin account (a chicken-and-egg case this trigger
-- deliberately does not special-case), run the following once, directly in the
-- Supabase SQL editor with your own DB owner/service credentials, not from the app:
--   UPDATE public.profiles SET role = 'admin', active_role = 'admin' WHERE id = '<your-user-id>';
