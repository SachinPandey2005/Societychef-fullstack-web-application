-- Migration: 20260922000000_add_party_and_chat_columns.sql
-- Description: Adds the columns/table that the party pre-booking and chat
-- features have always assumed exist, but which were never actually created
-- in this database (confirmed via a live schema dump on 2026-09-22 —
-- supabase/schema.sql, the repo's reference schema file, does not match what
-- is actually deployed here).
--
-- Concretely, this means public.orders.insert({..., is_party_order: true,
-- guest_count, per_head_price, party_booking_date, selected_pack_name,
-- party_dishes}) in apps/mobile/services/supabase/partyService.ts#placePartyOrder
-- has always failed with "column does not exist", silently (the error was only
-- console.warn'd, never surfaced), while the function unconditionally returned
-- a mock success anyway — so every party booking a customer has ever placed
-- looked successful and created no real order at all. See the accompanying
-- code fixes in the same change for the app-side half of this.

-- ─── 1. Party-order fields on orders ────────────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_party_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_count integer,
  ADD COLUMN IF NOT EXISTS per_head_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_booking_date timestamptz,
  ADD COLUMN IF NOT EXISTS selected_pack_name text,
  ADD COLUMN IF NOT EXISTS party_dishes jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_is_party_order ON public.orders (is_party_order) WHERE is_party_order = true;

-- ─── 2. party_menus table ───────────────────────────────────────────────────
-- Read/written by apps/backend/src/controllers/party.controller.ts
-- (getPartyMenu/savePartyMenu/getPartyKitchens) and
-- apps/mobile/services/supabase/partyService.ts — neither the table nor any
-- RLS on it existed before this migration.
CREATE TABLE IF NOT EXISTS public.party_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL UNIQUE REFERENCES public.kitchens(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  min_guests integer NOT NULL DEFAULT 10,
  advance_notice_hours integer NOT NULL DEFAULT 24,
  packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  dishes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.party_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "party_menus_select_public" ON public.party_menus;
DROP POLICY IF EXISTS "party_menus_write_owner" ON public.party_menus;

-- Consumers browse party catering (GET /party/kitchens, GET /party/menu/:id)
-- with no auth requirement today — mirror that: anyone can read an ENABLED
-- menu; the owning chef (or ops/admin) can also read their own even while
-- disabled/being edited.
CREATE POLICY "party_menus_select_public" ON public.party_menus
  FOR SELECT TO anon, authenticated
  USING (
    is_enabled = true
    OR kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN')
  );

-- Only the owning chef or ops/admin may create/edit a kitchen's party menu.
-- (The PUT /party/menu/:kitchenId route previously had no auth middleware at
-- all — see the accompanying route fix — this is the matching DB-level check.)
CREATE POLICY "party_menus_write_owner" ON public.party_menus
  FOR ALL TO authenticated
  USING (
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN')
  )
  WITH CHECK (
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN')
  );

-- ─── 3. Chat message fields ─────────────────────────────────────────────────
-- components/ChatScreen.tsx reads/writes media_url, is_read and status on
-- every message — none of these existed, so attachments and read receipts
-- have never actually persisted.
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'SENT';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_status_check'
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_status_check CHECK (status IN ('SENT', 'DELIVERED', 'READ'));
  END IF;
END $$;
