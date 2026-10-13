-- Phase 2 of the Supabase->Neon migration: replacing Supabase Auth with
-- MSG91 OTP + a self-issued JWT. The one password-based flow in this
-- otherwise phone-OTP app is admin login (AuthService.adminLogin) and
-- password reset (crm.controller.ts#resetUserPassword), both of which
-- previously delegated to supabase.auth.signInWithPassword /
-- supabase.auth.admin.updateUserById — there is no password storage of our
-- own anywhere. Added here so the backend can own this itself.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;
