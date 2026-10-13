-- Structural portions of the 6 pending Supabase migrations that don't depend
-- on auth.uid()/auth.role() (which only exist in a Supabase-provisioned
-- project). RLS policies and the role-escalation trigger are intentionally
-- left out here — see supabase/local/README.md for why and what replaces them.
--
-- Source migrations:
--   20260920000000_add_profile_coordinates.sql   -> skipped entirely (no-op; dump already has latitude/longitude on profiles)
--   20260920000001_lock_down_orders_authorization.sql -> skipped entirely (pure RLS + trigger, see README)
--   20260920000002_prevent_profile_role_escalation.sql -> skipped entirely (pure trigger, see README)
--   20260920000003_create_payout_requests_table.sql -> table DDL ported below, RLS policy skipped
--   20260920000004_backfill_kitchens_is_live.sql -> ported below (harmless on an empty table)
--   20260922000000_add_party_and_chat_columns.sql -> column/table DDL ported below, RLS policies skipped

-- ─── from 20260920000003 ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  bank_details jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED')),
  reference_id text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_kitchen_id ON public.payout_requests(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- ─── from 20260920000004 ────────────────────────────────────────────────────
UPDATE public.kitchens SET is_live = true WHERE is_live IS DISTINCT FROM true;

-- ─── from 20260922000000, section 1 (orders) ────────────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_party_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_count integer,
  ADD COLUMN IF NOT EXISTS per_head_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_booking_date timestamptz,
  ADD COLUMN IF NOT EXISTS selected_pack_name text,
  ADD COLUMN IF NOT EXISTS party_dishes jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_is_party_order ON public.orders (is_party_order) WHERE is_party_order = true;

-- ─── from 20260922000000, section 2 (party_menus table only, no RLS) ───────
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

-- ─── from 20260922000000, section 3 (chat_messages) ─────────────────────────
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
