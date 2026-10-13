-- ============================================================================
-- SOCIETY CHEF: COMBINED 1-CLICK PRODUCTION DATABASE SCHEMA
-- Execute this entire file in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('consumer', 'chef', 'ops');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
      'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'consumer',
  roles TEXT[] DEFAULT ARRAY['consumer'],
  active_role TEXT DEFAULT 'consumer',
  name TEXT,
  display_name TEXT,
  society TEXT,
  society_id UUID,
  tower TEXT,
  flat TEXT,
  address TEXT,
  chef_profile_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. KITCHENS TABLE
CREATE TABLE IF NOT EXISTS public.kitchens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  chef_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  society TEXT NOT NULL,
  address TEXT,
  specialty TEXT DEFAULT 'Homestyle Indian',
  rating NUMERIC(2,1) DEFAULT 5.0,
  orders_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_top_rated BOOLEAN DEFAULT FALSE,
  hygiene_verified BOOLEAN DEFAULT TRUE,
  bio TEXT,
  cover_image TEXT,
  profile_image TEXT,
  kitchen_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DISHES CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitchen_id UUID REFERENCES public.kitchens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Main Course',
  price NUMERIC(10,2) NOT NULL,
  is_free BOOLEAN DEFAULT FALSE,
  prep_time_minutes INT DEFAULT 30,
  diet_type TEXT DEFAULT 'VEG',
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WEEKLY SCHEDULED DISHES TABLE
CREATE TABLE IF NOT EXISTS public.weekly_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  kitchen_name TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  category TEXT DEFAULT 'Main Course',
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  day TEXT NOT NULL,
  total_quantity INT DEFAULT 20,
  remaining_quantity INT DEFAULT 20,
  food_type TEXT DEFAULT 'Veg',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  consumer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES public.kitchens(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  status order_status DEFAULT 'placed',
  delivery_method TEXT DEFAULT 'DELIVERY_PARTNER',
  delivery_fee NUMERIC(10,2) DEFAULT 10.0,
  allergy_info JSONB DEFAULT '{}'::jsonb,
  delivery_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL,
  dish_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PORTION DECREMENT RPC
CREATE OR REPLACE FUNCTION public.decrement_dish_quantity(p_dish_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.weekly_dishes
  SET remaining_quantity = GREATEST(0, remaining_quantity - p_qty),
      status = CASE WHEN remaining_quantity - p_qty <= 0 THEN 'sold_out' ELSE status END
  WHERE id = p_dish_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. PORTION RESTORATION RPC ON CANCELLATION
CREATE OR REPLACE FUNCTION public.restore_dish_quantity(p_dish_id UUID, p_qty INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.weekly_dishes
  SET remaining_quantity = remaining_quantity + p_qty,
      status = 'active'
  WHERE id = p_dish_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 12. RLS POLICIES (PERMISSIVE FOR APP OPERATIONS)
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public profiles update" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public kitchens read" ON public.kitchens FOR SELECT USING (true);
CREATE POLICY "Public dishes read" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Public weekly_dishes read" ON public.weekly_dishes FOR SELECT USING (true);

CREATE POLICY "Public orders read" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public orders insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders update" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Public order_items read" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public order_items insert" ON public.order_items FOR INSERT WITH CHECK (true);

-- 13. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL,
  kitchen_id TEXT NOT NULL,
  kitchen_name TEXT,
  dish_id TEXT,
  dish_name TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CHAT THREADS TABLE
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  kitchen_id UUID REFERENCES public.kitchens(id) ON DELETE CASCADE,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. REVIEWS & CHAT RLS & POLICIES
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reviews read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public reviews insert" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public reviews delete" ON public.reviews FOR DELETE USING (true);

CREATE POLICY "Public chat_threads read" ON public.chat_threads FOR SELECT USING (true);
CREATE POLICY "Public chat_threads insert" ON public.chat_threads FOR INSERT WITH CHECK (true);

CREATE POLICY "Public chat_messages read" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Public chat_messages insert" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- 17. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'credit', 'debit'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. WALLETS RLS & POLICIES
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public wallets read" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Public wallets insert" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public wallets update" ON public.wallets FOR UPDATE USING (true);

CREATE POLICY "Public wallet_transactions read" ON public.wallet_transactions FOR SELECT USING (true);
CREATE POLICY "Public wallet_transactions insert" ON public.wallet_transactions FOR INSERT WITH CHECK (true);

-- SUCCESS CONFIRMATION
SELECT 'Society Chef Schema Initialized Successfully!' AS result;
