-- Migration: Create payments table and webhook idempotency table for Cashfree Payment Gateway
-- Timestamp: 2026-09-09

-- 1. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL, -- references public.orders(id) or master checkout id
  consumer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  payment_gateway text NOT NULL DEFAULT 'CASHFREE',
  cf_order_id text UNIQUE,
  payment_session_id text,
  cf_payment_id text,
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'CAPTURED', 'SUCCESS', 'FAILED', 'USER_DROPPED', 'REFUND_PENDING', 'REFUNDED')),
  payment_method text,
  payment_timestamp timestamptz,
  refund_status text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure Cashfree column aliases exist on public.orders for direct queries
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cf_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cf_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_session_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'CASHFREE';

-- 2. Create Webhook Events Table for Strict Idempotency & Replay Protection
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  cf_order_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_consumer_id ON public.payments(consumer_id);
CREATE INDEX IF NOT EXISTS idx_payments_cf_order_id ON public.payments(cf_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_cf_order_id ON public.webhook_events(cf_order_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Consumers can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = consumer_id);

CREATE POLICY "Admins and Ops can view all payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'ops', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Service role full access to payments"
  ON public.payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Webhook events policies (internal / service role only)
CREATE POLICY "Service role full access to webhook_events"
  ON public.webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
