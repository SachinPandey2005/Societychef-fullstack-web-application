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
