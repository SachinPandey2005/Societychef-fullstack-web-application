-- Migration: 20260814000000_ensure_default_dish_stub.sql
-- Description: Pre-populate system fallback profile, kitchen, and dish rows so foreign key constraints on orders and order_items always succeed regardless of RLS boundaries.

-- 1. Ensure master system profile
INSERT INTO public.profiles (id, name, phone, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'System Customer',
  '+919999999999',
  'consumer'
) ON CONFLICT (id) DO NOTHING;

-- 2. Ensure master system kitchen
INSERT INTO public.kitchens (id, name, chef_name, address, is_live)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Master Kitchen',
  'Master Chef',
  'Lotus Heights',
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Ensure master system dish stub
INSERT INTO public.dishes (id, kitchen_id, name, price, is_available)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Master Dish',
  140,
  true
) ON CONFLICT (id) DO NOTHING;
