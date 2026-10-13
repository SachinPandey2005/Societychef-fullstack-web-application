-- Migration: 004_complete_schema.sql
-- Consolidates and applies missing tables and schema fixes.

-- NOTE: In a production Supabase instance, you would normally write ALTER TABLE statements
-- to handle migrations. Since this schema was heavily incomplete, it is recommended to apply
-- the new `schema.sql` directly or apply these missing tables if you are already live.

-- 1. Rename chef_profiles to kitchens
ALTER TABLE IF EXISTS public.chef_profiles RENAME TO kitchens;

-- Rename the foreign key columns in other tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kitchen_media' AND column_name='chef_profile_id') THEN
        ALTER TABLE public.kitchen_media RENAME COLUMN chef_profile_id TO kitchen_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='chef_profile_id') THEN
        ALTER TABLE public.orders RENAME COLUMN chef_profile_id TO kitchen_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='settlements' AND column_name='chef_profile_id') THEN
        ALTER TABLE public.settlements RENAME COLUMN chef_profile_id TO kitchen_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='chef_profile_id') THEN
        ALTER TABLE public.campaigns RENAME COLUMN chef_profile_id TO kitchen_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_threads' AND column_name='chef_profile_id') THEN
        ALTER TABLE public.chat_threads RENAME COLUMN chef_profile_id TO kitchen_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='supply_orders' AND column_name='chef_profile_id') THEN
        ALTER TABLE public.supply_orders RENAME COLUMN chef_profile_id TO kitchen_id;
    END IF;
END $$;

-- 2. Add Missing Tables
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  dish_id uuid not null references public.dishes(id),
  dish_name_snapshot text not null,
  price_snapshot numeric not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid not null references public.profiles(id),
  label text not null,
  full_address text not null,
  latitude numeric,
  longitude numeric,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  vehicle_type text not null,
  status text not null default 'OFFLINE',
  current_latitude numeric,
  current_longitude numeric,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  consumer_id uuid not null references public.profiles(id),
  kitchen_id uuid not null references public.kitchens(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  role text not null check (role in ('consumer', 'chef')),
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, role)
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  amount numeric not null,
  type text not null check (type in ('CREDIT', 'DEBIT')),
  description text,
  created_at timestamptz not null default now()
);

-- Advanced Features
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
