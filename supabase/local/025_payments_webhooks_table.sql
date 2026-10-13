-- Checkout has been completely broken for every paid order: PaymentRepository
-- queries a `payments` table that was confirmed absent back in Phase 1 (and
-- never fixed, since Cashfree was expected to be replaced). The user decided
-- to keep Cashfree, so this builds the real schema per the already-specified
-- types/payment.ts shape, same pattern as every other missing-table fix in
-- this migration.
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  consumer_id uuid NOT NULL,
  payment_gateway text,
  cf_order_id text,
  payment_session_id text,
  cf_payment_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  payment_method text,
  payment_status text NOT NULL DEFAULT 'PENDING',
  payment_timestamp timestamptz,
  refund_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_consumer_id ON payments(consumer_id);
CREATE INDEX IF NOT EXISTS idx_payments_cf_order_id ON payments(cf_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- Webhook idempotency/replay-protection ledger (see
-- cashfree.service.ts#handleWebhookEvent) — also never existed.
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  cf_order_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Gateway reference columns cashfree.service.ts writes onto orders that
-- never existed either (orders already has razorpay_order_id/
-- razorpay_payment_id from an earlier integration, but nothing Cashfree-specific).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cf_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_session_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cf_payment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
