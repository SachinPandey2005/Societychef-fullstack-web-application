-- Migration 004: RLS Policies, Security Controls, and Atomic RPC Functions for Live Readiness
-- Run in Supabase SQL editor or apply via Supabase CLI

-- 1. Schema Reconciliation on weekly_dishes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_dishes' AND column_name = 'kitchen_id'
  ) THEN
    ALTER TABLE weekly_dishes ADD COLUMN kitchen_id uuid REFERENCES kitchens(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Atomic RPC Functions for Pre-order Quantity Management
CREATE OR REPLACE FUNCTION decrement_dish_quantity(dish_id uuid, qty integer)
RETURNS void AS $$
BEGIN
  UPDATE weekly_dishes
  SET
    remaining_quantity = GREATEST(remaining_quantity - qty, 0),
    status = CASE
               WHEN remaining_quantity - qty <= 0 THEN 'sold_out'
               ELSE status
             END,
    updated_at = now()
  WHERE id = dish_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION restore_dish_quantity(dish_id uuid, qty integer)
RETURNS void AS $$
BEGIN
  UPDATE weekly_dishes
  SET
    remaining_quantity = remaining_quantity + qty,
    status = CASE
               WHEN status = 'sold_out' AND (remaining_quantity + qty) > 0 THEN 'active'
               ELSE status
             END,
    updated_at = now()
  WHERE id = dish_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable Row Level Security (RLS) on all exposed tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.weekly_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Profiles
DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
CREATE POLICY "Public select profiles" ON public.profiles
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);

-- Societies
DROP POLICY IF EXISTS "Public select societies" ON public.societies;
CREATE POLICY "Public select societies" ON public.societies
  FOR SELECT TO authenticated, anon USING (true);

-- Kitchens
DROP POLICY IF EXISTS "Public select kitchens" ON public.kitchens;
CREATE POLICY "Public select kitchens" ON public.kitchens
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Chefs update own kitchen" ON public.kitchens;
CREATE POLICY "Chefs update own kitchen" ON public.kitchens
  FOR UPDATE TO authenticated USING ((select auth.uid()) = chef_user_id) WITH CHECK ((select auth.uid()) = chef_user_id);

DROP POLICY IF EXISTS "Chefs insert own kitchen" ON public.kitchens;
CREATE POLICY "Chefs insert own kitchen" ON public.kitchens
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = chef_user_id);

-- Dishes
DROP POLICY IF EXISTS "Public select dishes" ON public.dishes;
CREATE POLICY "Public select dishes" ON public.dishes
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Authenticated edit dishes" ON public.dishes;
CREATE POLICY "Authenticated edit dishes" ON public.dishes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Weekly Dishes
DROP POLICY IF EXISTS "Public select weekly dishes" ON public.weekly_dishes;
CREATE POLICY "Public select weekly dishes" ON public.weekly_dishes
  FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Authenticated edit weekly dishes" ON public.weekly_dishes;
CREATE POLICY "Authenticated edit weekly dishes" ON public.weekly_dishes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "Authenticated select orders" ON public.orders;
CREATE POLICY "Authenticated select orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Consumers insert orders" ON public.orders;
CREATE POLICY "Consumers insert orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update orders" ON public.orders;
CREATE POLICY "Authenticated update orders" ON public.orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Order Items
DROP POLICY IF EXISTS "Authenticated order items" ON public.order_items;
CREATE POLICY "Authenticated order items" ON public.order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chat Threads & Messages
DROP POLICY IF EXISTS "Authenticated chat threads" ON public.chat_threads;
CREATE POLICY "Authenticated chat threads" ON public.chat_threads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated chat messages" ON public.chat_messages;
CREATE POLICY "Authenticated chat messages" ON public.chat_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
