-- Phase: Party Mode (Bulk Order / Pre-Booking)

-- 1. Create party_menus table
CREATE TABLE IF NOT EXISTS public.party_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  min_guests integer NOT NULL DEFAULT 8,
  advance_notice_hours integer NOT NULL DEFAULT 48,
  packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  dishes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT party_menus_kitchen_id_key UNIQUE (kitchen_id)
);

-- Enable RLS on party_menus
ALTER TABLE public.party_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to party menus"
  ON public.party_menus FOR SELECT
  USING (true);

CREATE POLICY "Allow chefs to manage their kitchen party menu"
  ON public.party_menus FOR ALL
  USING (auth.uid() IN (
    SELECT chef_user_id FROM public.kitchens WHERE id = kitchen_id
  ));

-- 2. Add party fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_party_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS party_booking_date timestamptz,
  ADD COLUMN IF NOT EXISTS guest_count integer,
  ADD COLUMN IF NOT EXISTS selected_pack_name text,
  ADD COLUMN IF NOT EXISTS per_head_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_dishes jsonb DEFAULT '[]'::jsonb;
