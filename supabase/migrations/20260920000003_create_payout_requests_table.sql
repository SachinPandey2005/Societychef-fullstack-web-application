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
