-- Migration: 007_earnings_and_commissions.sql
-- Description: Commission Rules, Tax Rules, and Extended Settlements/Refunds

-- 1. Commission Rules
CREATE TABLE public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kitchen_id UUID REFERENCES public.kitchens(id) ON DELETE CASCADE, -- NULL means global rule
    category TEXT, -- e.g. 'BAKERY', 'MEALS'
    percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    fixed_fee NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert Default Global Commission (10%)
INSERT INTO public.commission_rules (percentage, active) VALUES (10, true);

-- 2. Tax Rules
CREATE TABLE public.tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region TEXT NOT NULL DEFAULT 'DEFAULT',
    tax_type TEXT NOT NULL, -- e.g. 'GST'
    percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert Default Tax Rule (0% for now)
INSERT INTO public.tax_rules (tax_type, percentage, active) VALUES ('GST', 0, true);

-- 3. Modify Settlements for strict tracking
ALTER TABLE public.settlements 
  ADD COLUMN IF NOT EXISTS held_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT,
  DROP CONSTRAINT IF EXISTS settlements_status_check;

ALTER TABLE public.settlements 
  ADD CONSTRAINT settlements_status_check 
  CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'));

-- 4. Extend Orders table to store detailed earnings breakdown
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_chef_earnings NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;

-- Trigger updates
CREATE OR REPLACE FUNCTION update_comm_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comm_rules_updated
BEFORE UPDATE ON public.commission_rules
FOR EACH ROW EXECUTE FUNCTION update_comm_rules_updated_at();

CREATE TRIGGER trg_tax_rules_updated
BEFORE UPDATE ON public.tax_rules
FOR EACH ROW EXECUTE FUNCTION update_comm_rules_updated_at();
