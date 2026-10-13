-- Migration: 008_schema_fixes.sql
-- Resolves validation discrepancies between backend types and schema.

-- 1. Fix Profiles Table
ALTER TABLE public.profiles RENAME COLUMN display_name TO name;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Drop the restrictive role constraint to allow 'super_admin', 'admin', 'SUPPORT_AGENT', etc.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Fix Societies Table
ALTER TABLE public.societies RENAME COLUMN latitude TO lat;
ALTER TABLE public.societies RENAME COLUMN longitude TO lng;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS address text;

-- 3. Fix Settlements Table
ALTER TABLE public.settlements RENAME COLUMN gross_amount TO total_sales;
ALTER TABLE public.settlements RENAME COLUMN platform_fee TO platform_commission;
ALTER TABLE public.settlements RENAME COLUMN gateway_fee TO gateway_fees;
ALTER TABLE public.settlements RENAME COLUMN net_amount TO net_payable;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS taxes numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS refund_adjustments numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS period_end date;

-- 4. Fix Orders Table
ALTER TABLE public.orders RENAME COLUMN list_price TO item_total;
ALTER TABLE public.orders RENAME COLUMN discount TO discount_amount;
ALTER TABLE public.orders RENAME COLUMN total_paid TO grand_total;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS taxes numeric DEFAULT 0;

-- 5. RLS Policies on Financials
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallets" 
ON public.wallets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can read own wallet transactions" 
ON public.wallet_transactions FOR SELECT 
USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));
