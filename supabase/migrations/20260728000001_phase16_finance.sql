-- Phase 16: Finance, Refunds, Financial Adjustments, Settlement Reversal & Disputes Schema

-- 1. Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_code text UNIQUE NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.profiles(id),
  kitchen_id uuid REFERENCES public.kitchens(id),
  payment_id text,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('FULL', 'PARTIAL', 'MANUAL', 'AUTOMATIC')),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED')),
  requested_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  processed_by uuid REFERENCES public.profiles(id),
  refund_reference text,
  gateway_refund_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Financial Adjustments Table
CREATE TABLE IF NOT EXISTS public.financial_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_code text UNIQUE NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('COMMISSION_CORRECTION', 'SETTLEMENT_CORRECTION', 'WALLET_CORRECTION', 'TAX_ADJUSTMENT', 'DELIVERY_CHARGE_ADJUSTMENT', 'MANUAL_ACCOUNTING_ENTRY', 'REFUND_ADJUSTMENT', 'SETTLEMENT_REVERSAL', 'PENALTY', 'CHARGEBACK', 'BONUS', 'INCENTIVE')),
  target_type text NOT NULL CHECK (target_type IN ('CHEF', 'CUSTOMER', 'PLATFORM')),
  target_id uuid, -- profile_id or kitchen_id
  amount numeric NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('CREDIT', 'DEBIT')),
  reason text NOT NULL,
  requested_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  reference_entity_type text, -- 'order', 'settlement', 'dispute', 'refund'
  reference_entity_id text,
  supporting_notes text,
  status text NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Dispute Cases Table
CREATE TABLE IF NOT EXISTS public.dispute_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_code text UNIQUE NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.profiles(id),
  kitchen_id uuid REFERENCES public.kitchens(id),
  category text NOT NULL CHECK (category IN ('INCORRECT_CHARGE', 'MISSING_REFUND', 'DUPLICATE_PAYMENT', 'WRONG_SETTLEMENT', 'WRONG_COMMISSION', 'FAILED_PAYOUT', 'FRAUD_REVIEW')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED')),
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  assigned_agent_id uuid REFERENCES public.profiles(id),
  description text NOT NULL,
  resolution_notes text,
  resolution_time_minutes integer,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Dispute Comments Table
CREATE TABLE IF NOT EXISTS public.dispute_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.dispute_cases(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id),
  author_role text,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer ON public.refunds(customer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_kitchen ON public.refunds(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

CREATE INDEX IF NOT EXISTS idx_adjustments_target ON public.financial_adjustments(target_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_type ON public.financial_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_adjustments_ref ON public.financial_adjustments(reference_entity_type, reference_entity_id);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.dispute_cases(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON public.dispute_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_kitchen ON public.dispute_cases(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.dispute_cases(status);

CREATE INDEX IF NOT EXISTS idx_dispute_comments_dispute ON public.dispute_comments(dispute_id);

-- Triggers for modtime
CREATE TRIGGER update_refunds_modtime BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_disputes_modtime BEFORE UPDATE ON public.dispute_cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
