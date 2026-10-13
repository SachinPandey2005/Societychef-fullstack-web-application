-- Supabase CRM RLS Policy Fixes
-- Run this in your Supabase SQL Editor to enable full access for testing and seeding.

-- Enable RLS on all relevant tables
ALTER TABLE IF EXISTS public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints ENABLE ROW LEVEL SECURITY;

-- 1. Societies Policies
DROP POLICY IF EXISTS "Public select societies" ON public.societies;
DROP POLICY IF EXISTS "Public all societies" ON public.societies;
CREATE POLICY "Public all societies" ON public.societies
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 2. Settlements Policies
DROP POLICY IF EXISTS "Public select settlements" ON public.settlements;
DROP POLICY IF EXISTS "Public all settlements" ON public.settlements;
CREATE POLICY "Public all settlements" ON public.settlements
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 3. Tickets Policies
DROP POLICY IF EXISTS "Public select tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public all tickets" ON public.tickets;
CREATE POLICY "Public all tickets" ON public.tickets
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 4. Refunds Policies
DROP POLICY IF EXISTS "Public select refunds" ON public.refunds;
DROP POLICY IF EXISTS "Public all refunds" ON public.refunds;
CREATE POLICY "Public all refunds" ON public.refunds
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 5. Audit Logs Policies
DROP POLICY IF EXISTS "Public select audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public all audit_logs" ON public.audit_logs;
CREATE POLICY "Public all audit_logs" ON public.audit_logs
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 6. Complaints Policies
DROP POLICY IF EXISTS "Public select complaints" ON public.complaints;
DROP POLICY IF EXISTS "Public all complaints" ON public.complaints;
CREATE POLICY "Public all complaints" ON public.complaints
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 7. Orders & Order Items Policies
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public all orders" ON public.orders;
CREATE POLICY "Public all orders" ON public.orders
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all order_items" ON public.order_items;
CREATE POLICY "Public all order_items" ON public.order_items
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 8. Profiles, Kitchens, Dishes, Delivery Partners Policies
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public all profiles" ON public.profiles;
CREATE POLICY "Public all profiles" ON public.profiles
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all kitchens" ON public.kitchens;
CREATE POLICY "Public all kitchens" ON public.kitchens
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all dishes" ON public.dishes;
CREATE POLICY "Public all dishes" ON public.dishes
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public all delivery_partners" ON public.delivery_partners;
CREATE POLICY "Public all delivery_partners" ON public.delivery_partners
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
