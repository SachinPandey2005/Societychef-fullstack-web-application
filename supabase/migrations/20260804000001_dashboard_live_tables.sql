-- Phase 4 Live Dashboard Tables Migration
-- Run in Supabase SQL editor or apply via Supabase CLI

-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('BONUS', 'POLICY', 'WEATHER', 'MAINTENANCE', 'ALERT')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create partner_shifts table
CREATE TABLE IF NOT EXISTS public.partner_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  shift_title text NOT NULL,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  hours_worked numeric(5,2) DEFAULT 0.00,
  break_time_minutes integer DEFAULT 0,
  is_late_arrival boolean DEFAULT false,
  attendance_status text DEFAULT 'PRESENT' CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shifts ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies
-- Announcements: Authenticated users can view active announcements
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
CREATE POLICY "Anyone can view announcements" 
ON public.announcements FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Notifications: Users can view and update their own notifications
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" 
ON public.notifications FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Partner Shifts: Partners can view their own shifts
DROP POLICY IF EXISTS "Partners can view own shifts" ON public.partner_shifts;
CREATE POLICY "Partners can view own shifts" 
ON public.partner_shifts FOR SELECT 
TO authenticated 
USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

-- 6. Insert Seed Data
INSERT INTO public.announcements (title, content, type, is_active)
VALUES
  ('Monsoon Rain Surge Active', 'Earn an additional ₹15 surge bonus per delivery in active rain zones.', 'WEATHER', true),
  ('RFID Gate Pass Policy', 'Tap your badge at the resident gate scanner for automated society entry.', 'POLICY', true),
  ('Independence Day Payout Campaign', 'Deliver 15 orders on August 15th to get a special ₹500 payout bonus.', 'BONUS', true)
ON CONFLICT DO NOTHING;
