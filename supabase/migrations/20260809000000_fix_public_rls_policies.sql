-- ==============================================================================
-- Migration: Hardened Production Row Level Security (RLS) Policies
-- Project: Society Chef / RasoHi Platform
-- ==============================================================================

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE IF EXISTS public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.weekly_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. DISHES Table Policies
DROP POLICY IF EXISTS "Public read dishes" ON public.dishes;
DROP POLICY IF EXISTS "Chefs manage own kitchen dishes" ON public.dishes;
DROP POLICY IF EXISTS "Authenticated edit dishes" ON public.dishes;
DROP POLICY IF EXISTS "Allow all writes dishes" ON public.dishes;

CREATE POLICY "Public read dishes" ON public.dishes
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Chefs manage own kitchen dishes" ON public.dishes
  FOR ALL TO authenticated
  USING (
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR 
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  )
  WITH CHECK (
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR 
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

-- 3. WEEKLY_DISHES Table Policies
DROP POLICY IF EXISTS "Public read weekly_dishes" ON public.weekly_dishes;
DROP POLICY IF EXISTS "Public select weekly dishes" ON public.weekly_dishes;
DROP POLICY IF EXISTS "Chefs manage own weekly schedule" ON public.weekly_dishes;
DROP POLICY IF EXISTS "Authenticated edit weekly dishes" ON public.weekly_dishes;
DROP POLICY IF EXISTS "Allow all writes weekly_dishes" ON public.weekly_dishes;

CREATE POLICY "Public read weekly_dishes" ON public.weekly_dishes
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Chefs manage own weekly schedule" ON public.weekly_dishes
  FOR ALL TO authenticated
  USING (
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR 
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  )
  WITH CHECK (
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR 
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

-- 4. KITCHENS Table Policies
DROP POLICY IF EXISTS "Public read kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Allow all writes kitchens" ON public.kitchens;
DROP POLICY IF EXISTS "Chefs manage own kitchen" ON public.kitchens;

CREATE POLICY "Public read kitchens" ON public.kitchens
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Chefs manage own kitchen" ON public.kitchens
  FOR ALL TO authenticated
  USING (
    chef_user_id = auth.uid() OR 
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  )
  WITH CHECK (
    chef_user_id = auth.uid() OR 
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

-- 5. ORDERS Table Policies
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all writes orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Consumers place orders" ON public.orders;
DROP POLICY IF EXISTS "Authorized update orders" ON public.orders;

CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid() OR 
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
    delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

CREATE POLICY "Consumers place orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Authorized update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid() OR 
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
    delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  )
  WITH CHECK (
    customer_id = auth.uid() OR 
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
    delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

-- 6. ORDER_ITEMS Table Policies
DROP POLICY IF EXISTS "Public read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow all writes order_items" ON public.order_items;
DROP POLICY IF EXISTS "Access order items via order context" ON public.order_items;

CREATE POLICY "Access order items via order context" ON public.order_items
  FOR ALL TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        customer_id = auth.uid() OR 
        kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
        delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
        auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
    )
  );

-- 7. Schema Adjustments & Realtime Subscriptions
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_dish_id_fkey;
ALTER TABLE public.order_items ALTER COLUMN dish_id DROP NOT NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_dishes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
