-- Phase 5 Push Notification Core Tables Migration
-- Run in Supabase SQL editor or apply via Supabase CLI

-- 1. Create device_tokens table
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  promotional_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies
-- Device Tokens: Users can register/read/delete their own tokens
DROP POLICY IF EXISTS "Users can manage own device tokens" ON public.device_tokens;
CREATE POLICY "Users can manage own device tokens" 
ON public.device_tokens FOR ALL 
TO authenticated 
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Notification Preferences: Users can manage their own preferences
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" 
ON public.notification_preferences FOR ALL 
TO authenticated 
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());
