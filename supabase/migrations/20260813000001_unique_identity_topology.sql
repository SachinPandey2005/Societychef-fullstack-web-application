-- ==============================================================================
-- Migration: 20260813000001_unique_identity_topology.sql
-- Description: Enforces 1-to-1 unique identity relationships for Customers, Chefs, and Delivery Partners.
-- Project: Society Chef
-- ==============================================================================

-- 1. Ensure Profiles Phone & ID Uniqueness
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_phone_key' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);
  END IF;
END $$;

-- 2. Ensure 1-to-1 Mapping for Chef Kitchens
CREATE UNIQUE INDEX IF NOT EXISTS idx_kitchens_chef_user_id_unique 
ON public.kitchens (chef_user_id);

-- 3. Ensure 1-to-1 Mapping for Delivery Partners
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_partners_user_id_unique 
ON public.delivery_partners (user_id);

-- 4. Ensure Unique Active Wallet per User & Role
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_role_active 
ON public.wallets (user_id, role) WHERE (status = 'ACTIVE');

-- 5. Systematic Performance & Relational Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);
CREATE INDEX IF NOT EXISTS idx_kitchens_society_id ON public.kitchens (society_id);
CREATE INDEX IF NOT EXISTS idx_dishes_kitchen_id ON public.dishes (kitchen_id);
CREATE INDEX IF NOT EXISTS idx_weekly_dishes_kitchen_id_day ON public.weekly_dishes (kitchen_id, day);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_kitchen_id ON public.orders (kitchen_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON public.orders (delivery_partner_id);
