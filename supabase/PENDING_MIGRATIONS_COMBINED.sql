-- ============================================================================
-- CONSOLIDATED PENDING MIGRATIONS — run this whole file once in the Supabase
-- SQL editor. Combines, in required order, the 6 migrations below that have
-- not yet been applied to the live project. Regenerated 2026-09-22 after
-- fixing migration 20260920000001 (it originally assumed orders had a
-- consumer_id column, confirmed via live schema dump not to exist) and
-- adding 20260922000000 for the party-order and chat-message columns.
--
-- Deliberately NOT placed alongside the individual migrations for tooling
-- to pick up — this is a manual-paste convenience for the SQL editor only.
-- Source files (still the source of truth, in supabase/migrations/):
--   - 20260920000000_add_profile_coordinates.sql
--   - 20260920000001_lock_down_orders_authorization.sql
--   - 20260920000002_prevent_profile_role_escalation.sql
--   - 20260920000003_create_payout_requests_table.sql
--   - 20260920000004_backfill_kitchens_is_live.sql
--   - 20260922000000_add_party_and_chat_columns.sql
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- FILE: 20260920000000_add_profile_coordinates.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Migration: 20260920000000_add_profile_coordinates.sql
-- Description: Add nullable latitude/longitude to profiles so the consumer
-- delivery-address flow (mobile app "Add Delivery Address" screen) can store
-- the exact pin dropped via the map picker, alongside the existing free-text
-- society/tower/flat fields. Mirrors the latitude/longitude columns already
-- present on public.addresses and public.societies.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- ─────────────────────────────────────────────────────────────────────────
-- FILE: 20260920000001_lock_down_orders_authorization.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Migration: 20260920000001_lock_down_orders_authorization.sql
-- Description: Closes a critical authorization hole on public.orders / public.order_items.
--
-- 20260815000000_fix_orders_rls_policies.sql replaced the previous (broken) policies
-- with "FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)" — this granted
-- every unauthenticated and authenticated client, using nothing but the public anon
-- key, full read/write/delete access to every order on the platform: any customer's
-- orders, any chef's orders, and the ability to rewrite status, payment_status, or
-- financial totals on any row.
--
-- This migration replaces that with row-scoped policies (own order for consumers,
-- own kitchen's orders for chefs, everything for ops/admin — matching the pattern
-- already used in 20260813000000_production_security_remediation.sql for
-- dishes/weekly_dishes/kitchens), and adds a trigger that blocks non-service-role
-- writes to payment/settlement/identity columns, since those must only ever be set
-- by the backend after a verified Cashfree transaction (see
-- apps/backend/src/services/cashfree.service.ts), never by a mobile client.
--
-- REVISION NOTE: the first version of this migration referenced customer_id,
-- consumer_id and profile_id directly as literal column names, following
-- supabase/schema.sql — which turned out NOT to match the live database
-- (`column "consumer_id" does not exist`, error 42703). That reference file is
-- apparently aspirational/out of sync with what's actually deployed, so this
-- version stops trusting it: it introspects information_schema.columns at
-- migration time and only ever references whichever of the three
-- consumer-identity columns genuinely exist on THIS project's orders table,
-- and the trigger function uses to_jsonb(NEW)/(OLD) field lookups (which
-- safely return NULL for a column that isn't there) instead of direct NEW.col
-- / OLD.col access for every guarded column, not just the identity ones —
-- since schema.sql has now proven unreliable, no field on this table should
-- be assumed to exist without checking.

-- ─── 1. Reset existing permissive policies ─────────────────────────────────────
DROP POLICY IF EXISTS "Allow all read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all writes orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow all writes order_items" ON public.order_items;
DROP POLICY IF EXISTS "orders_select_scoped" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_scoped" ON public.orders;
DROP POLICY IF EXISTS "orders_update_scoped" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_scoped" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_scoped" ON public.order_items;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ─── 2. Build the consumer-ownership expression from whichever identity ────────
--        column(s) actually exist on this project's orders table, then create
--        all three row policies with it.
DO $$
DECLARE
  id_cols text[];
  owner_expr text;
BEGIN
  SELECT array_agg(column_name ORDER BY column_name)
  INTO id_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = ANY (ARRAY['customer_id', 'consumer_id', 'profile_id']);

  IF id_cols IS NULL OR array_length(id_cols, 1) IS NULL THEN
    -- No known consumer-identity column exists at all — fall back to "never
    -- matches" for the ownership check rather than generating invalid SQL.
    -- Kitchen-owner and ops/admin access still work normally either way.
    owner_expr := 'false';
    RAISE WARNING 'orders table has none of customer_id/consumer_id/profile_id — consumer row-ownership checks will never match. Review this table''s real schema.';
  ELSE
    owner_expr := format('auth.uid() IN (%s)', array_to_string(id_cols, ', '));
  END IF;

  -- ─── Scoped SELECT ────────────────────────────────────────────────────────
  EXECUTE format(
    'CREATE POLICY "orders_select_scoped" ON public.orders
       FOR SELECT TO authenticated
       USING (
         %s
         OR kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
         OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''ops'', ''admin'', ''SUPER_ADMIN'')
       )',
    owner_expr
  );

  -- ─── Scoped INSERT — a consumer may only create orders attributed to themselves ──
  EXECUTE format(
    'CREATE POLICY "orders_insert_scoped" ON public.orders
       FOR INSERT TO authenticated
       WITH CHECK (
         %s
         OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''ops'', ''admin'', ''SUPER_ADMIN'')
       )',
    owner_expr
  );

  -- ─── Scoped UPDATE ────────────────────────────────────────────────────────
  -- Row visibility: chef of the owning kitchen, the owning consumer, or ops/admin.
  -- Value check: chef/ops may set any status; a consumer's own row may only move
  -- to CANCELLED (this is what blocks the mobile "Simulate Next Status Step"
  -- affordance and any direct API call from setting arbitrary order progress).
  EXECUTE format(
    'CREATE POLICY "orders_update_scoped" ON public.orders
       FOR UPDATE TO authenticated
       USING (
         kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
         OR %1$s
         OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''ops'', ''admin'', ''SUPER_ADMIN'')
       )
       WITH CHECK (
         kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
         OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (''ops'', ''admin'', ''SUPER_ADMIN'')
         OR (
           %1$s
           AND upper(status) IN (''CANCELLED'', ''PLACED'')
         )
       )',
    owner_expr
  );
END $$;

-- ─── 5. order_items follow the parent order's visibility ───────────────────────
CREATE POLICY "order_items_select_scoped" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders));

CREATE POLICY "order_items_insert_scoped" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders));

-- ─── 6. Column-level lockdown for payment/settlement/identity fields ───────────
-- RLS alone restricts which ROWS a client can touch, not which COLUMNS within an
-- allowed row. Without this, a consumer legitimately allowed to cancel their own
-- order could smuggle `payment_status: 'paid'` into the same UPDATE call. This
-- trigger blocks any change to these columns unless the request is running as the
-- backend's service role (which bypasses RLS/triggers-by-role-check below and is
-- the only place that should ever mark a payment captured, per
-- apps/backend/src/services/cashfree.service.ts).
--
-- Uses to_jsonb(NEW)/(OLD) ->> 'col' instead of NEW.col/OLD.col direct access:
-- a direct reference to a column that doesn't exist on this table would raise
-- "record ... has no field ..." the first time this trigger actually fires,
-- and schema.sql has already proven unreliable once in this same migration —
-- the jsonb lookup simply returns NULL for a column that isn't there instead
-- of erroring, so this function works regardless of exactly which of these
-- columns this project's orders table really has.
CREATE OR REPLACE FUNCTION public.protect_order_financial_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_j jsonb := to_jsonb(NEW);
  old_j jsonb := to_jsonb(OLD);
  guarded_cols text[] := ARRAY[
    'payment_status', 'settlement_status', 'net_chef_earnings',
    'platform_commission', 'tax_amount', 'grand_total', 'total_amount',
    'total_paid', 'razorpay_order_id', 'kitchen_id',
    'customer_id', 'consumer_id', 'profile_id'
  ];
  col text;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  FOREACH col IN ARRAY guarded_cols LOOP
    IF (new_j ->> col) IS DISTINCT FROM (old_j ->> col) THEN
      RAISE EXCEPTION 'Not permitted: payment, settlement and financial fields on orders can only be updated by the backend payment service (column: %)', col;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_order_financial_columns ON public.orders;
CREATE TRIGGER trg_protect_order_financial_columns
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_order_financial_columns();

-- NOTE: this still leaves party-order pack additions (`addMorePartyPacks` in
-- apps/mobile/services/supabase/index.ts, which recalculates `total_amount`
-- client-side and writes it directly) unable to update `total_amount` from the
-- client going forward. That function needs to move to a backend endpoint that
-- recomputes the bill server-side — flagged as a required follow-up, not covered
-- by this migration, since it's a pricing-integrity change rather than pure
-- authorization and needs its own backend route.

-- ─────────────────────────────────────────────────────────────────────────
-- FILE: 20260920000002_prevent_profile_role_escalation.sql
-- ─────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────
-- FILE: 20260920000003_create_payout_requests_table.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Migration: 20260920000003_create_payout_requests_table.sql
-- Description: Creates public.payout_requests, which apps/backend's
-- InvoiceRepository.requestPayout / PayoutService.requestPayout already read
-- and write against — the table simply never existed, so a chef's payout
-- request would fail outright with "relation does not exist" the moment the
-- backend route was reachable. Also backs the chef-only GET /finance/... flows
-- added alongside this (see apps/backend/src/routes/finance.routes.ts).

CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  -- Snapshot of the kitchen's saved bank account at request time, resolved
  -- server-side (see KitchenRepository.getBankDetails) — never taken from the
  -- client directly, so a payout request can't be redirected to an arbitrary
  -- account by whoever calls the API.
  bank_details jsonb NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED')),
  reference_id text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_kitchen_id ON public.payout_requests(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- A chef may see (and create, via the backend's service role only — see below)
-- payout requests for their own kitchen; ops/admin/finance can see and manage
-- all of them. Matches the pattern used for orders/kitchens elsewhere.
CREATE POLICY "payout_requests_select_scoped" ON public.payout_requests
  FOR SELECT TO authenticated
  USING (
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN', 'OPERATIONS', 'FINANCE')
  );

-- INSERT/UPDATE are intentionally NOT granted to authenticated/anon: creating
-- and progressing a payout request always goes through the backend (which
-- resolves the requester's own kitchen and their saved bank details
-- server-side, using the service role that bypasses RLS), never a direct
-- client write. This mirrors the orders financial-column lockdown in
-- 20260920000001_lock_down_orders_authorization.sql — money-moving writes are
-- backend-verified, not client-trusted.

-- ─────────────────────────────────────────────────────────────────────────
-- FILE: 20260920000004_backfill_kitchens_is_live.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Migration: 20260920000004_backfill_kitchens_is_live.sql
-- Description: One-time backfill for public.kitchens.is_live.
--
-- The column defaults to `false` (see supabase/schema.sql), but nothing in
-- the chef registration/onboarding flow ever set it, and the mobile app's
-- kitchen-mapping function hardcoded `isLive: true` regardless of the real
-- column value — so every existing kitchen has is_live = false in the
-- database today, silently masked by that hardcode. The "Accepting orders /
-- Paused" toggle on the chef dashboard is being wired to this column now (see
-- apps/mobile/app/(chef)/dashboard.tsx and services/supabase/index.ts), and
-- consumer-facing listings are being changed to respect it — without this
-- backfill, that change would make every existing kitchen vanish from
-- discovery the moment it ships, since they'd all read as paused.
--
-- This treats every kitchen that exists today as live (the same effective
-- behavior the hardcoded `true` already gave them) and leaves the column's
-- default at `false` for genuinely new rows going forward — new kitchens are
-- set to `is_live = true` explicitly at creation time in the mobile app.
UPDATE public.kitchens SET is_live = true WHERE is_live IS DISTINCT FROM true;

-- ─────────────────────────────────────────────────────────────────────────
-- FILE: 20260922000000_add_party_and_chat_columns.sql
-- ─────────────────────────────────────────────────────────────────────────
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

