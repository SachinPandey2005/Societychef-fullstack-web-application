-- Migration: 20260815000000_fix_orders_rls_policies.sql
-- Description: Unblocks orders and order_items SELECT/INSERT/UPDATE for consumer and chef app operations.

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- Reset restrictive orders policies
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Consumers place orders" ON public.orders;
DROP POLICY IF EXISTS "Authorized update orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all writes orders" ON public.orders;

-- Grant public & authenticated read access to orders
CREATE POLICY "Allow all read orders" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (true);

-- Grant public & authenticated write/update access to orders
CREATE POLICY "Allow all writes orders" ON public.orders
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Reset restrictive order_items policies
DROP POLICY IF EXISTS "Access order items via order context" ON public.order_items;
DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow all read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow all writes order_items" ON public.order_items;

-- Grant public & authenticated read access to order_items
CREATE POLICY "Allow all read order_items" ON public.order_items
  FOR SELECT TO anon, authenticated
  USING (true);

-- Grant public & authenticated write access to order_items
CREATE POLICY "Allow all writes order_items" ON public.order_items
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure Realtime publication on orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
