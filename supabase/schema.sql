-- HomeChef (Society Chef) Complete Database Schema
-- Includes core users, societies, kitchens, catalog, orders, financial ledger, phase 16 refunds & disputes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  email text,
  name text,
  role text NOT NULL, -- 'consumer', 'chef', 'DELIVERY_PARTNER', 'ops', 'admin', 'SUPER_ADMIN'
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Societies Table
CREATE TABLE IF NOT EXISTS public.societies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  lat numeric,
  lng numeric,
  address text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  full_address text NOT NULL,
  latitude numeric,
  longitude numeric,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Delivery Partners Table
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL,
  status text NOT NULL DEFAULT 'OFFLINE',
  current_latitude numeric,
  current_longitude numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Kitchens Table
CREATE TABLE IF NOT EXISTS public.kitchens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  chef_name text NOT NULL,
  address text,
  society_id uuid REFERENCES public.societies(id) ON DELETE SET NULL,
  tower text,
  flat text,
  hide_identity boolean NOT NULL DEFAULT false,
  default_lead_time_minutes integer NOT NULL DEFAULT 120,
  bank_status text NOT NULL DEFAULT 'pending',
  hygiene_status text NOT NULL DEFAULT 'pending',
  is_verified boolean NOT NULL DEFAULT false,
  is_top_rated boolean NOT NULL DEFAULT false,
  is_live boolean NOT NULL DEFAULT false,
  cover_image text,
  profile_image text,
  story_prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  hygiene_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  trust_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  kitchen_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Dishes Table
CREATE TABLE IF NOT EXISTS public.dishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid REFERENCES public.kitchens(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  allergens text[] NOT NULL DEFAULT '{}',
  diet_type text CHECK (diet_type IN ('VEG', 'NONVEG')),
  price numeric NOT NULL DEFAULT 0,
  prep_time_minutes integer NOT NULL DEFAULT 120,
  is_available boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  image_url text,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE,
  order_number text,
  customer_id uuid REFERENCES public.profiles(id),
  consumer_id uuid REFERENCES public.profiles(id),
  profile_id uuid REFERENCES public.profiles(id),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id),
  status text NOT NULL DEFAULT 'PLACED',
  delivery_method text NOT NULL DEFAULT 'DELIVERY_PARTNER',
  delivery_partner_id uuid REFERENCES public.delivery_partners(id),
  delivery_fee numeric NOT NULL DEFAULT 0,
  item_total numeric NOT NULL DEFAULT 0,
  list_price numeric DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  taxes numeric NOT NULL DEFAULT 0,
  platform_commission numeric DEFAULT 0,
  net_chef_earnings numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  total_amount numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  delivery_address jsonb,
  delivery_details jsonb,
  allergy_tags text[] NOT NULL DEFAULT '{}',
  allergy_other_text text,
  allergy_info jsonb,
  payment_status text NOT NULL DEFAULT 'pending',
  settlement_status text DEFAULT 'PENDING',
  razorpay_order_id text,
  razorpay_payment_id text,
  accepted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure all column aliases exist on public.orders for 100% query compatibility
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consumer_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS list_price numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_paid numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_details jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS allergy_info jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS settlement_status text DEFAULT 'PENDING';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  dish_id text,
  dish_name text,
  dish_name_snapshot text,
  price numeric DEFAULT 0,
  price_snapshot numeric DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS dish_name text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  consumer_id uuid NOT NULL REFERENCES public.profiles(id),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Settlements Table
CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id),
  total_sales numeric NOT NULL DEFAULT 0,
  platform_commission numeric NOT NULL DEFAULT 0,
  gateway_fees numeric NOT NULL DEFAULT 0,
  taxes numeric NOT NULL DEFAULT 0,
  refund_adjustments numeric NOT NULL DEFAULT 0,
  net_payable numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  settlement_mode text NOT NULL DEFAULT 'weekly',
  period_start date,
  period_end date,
  expected_at timestamptz,
  held_transaction_id uuid,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  role text CHECK (role IN ('consumer', 'chef')),
  wallet_type text CHECK (wallet_type IN ('CONSUMER', 'CHEF', 'PLATFORM')),
  balance numeric NOT NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id),
  amount numeric NOT NULL,
  type text NOT NULL,
  source text,
  reference_id text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
  discount_value numeric NOT NULL,
  min_order_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 15. Chat Threads Table
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id uuid REFERENCES public.profiles(id),
  kitchen_id uuid REFERENCES public.kitchens(id),
  participant_1_id uuid REFERENCES public.profiles(id),
  participant_2_id uuid REFERENCES public.profiles(id),
  order_id uuid REFERENCES public.orders(id),
  thread_type text NOT NULL DEFAULT 'ORDER',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 16. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  body text NOT NULL,
  media_url text,
  is_read boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'SENT',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 17. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 18. Phase 16: Refunds Table
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

-- 19. Phase 16: Financial Adjustments Table
CREATE TABLE IF NOT EXISTS public.financial_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_code text UNIQUE NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('COMMISSION_CORRECTION', 'SETTLEMENT_CORRECTION', 'WALLET_CORRECTION', 'TAX_ADJUSTMENT', 'DELIVERY_CHARGE_ADJUSTMENT', 'MANUAL_ACCOUNTING_ENTRY', 'REFUND_ADJUSTMENT', 'SETTLEMENT_REVERSAL', 'PENALTY', 'CHARGEBACK', 'BONUS', 'INCENTIVE')),
  target_type text NOT NULL CHECK (target_type IN ('CHEF', 'CUSTOMER', 'PLATFORM')),
  target_id uuid,
  amount numeric NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('CREDIT', 'DEBIT')),
  reason text NOT NULL,
  requested_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  reference_entity_type text,
  reference_entity_id text,
  supporting_notes text,
  status text NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 20. Phase 16: Dispute Cases Table
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

-- 21. Phase 16: Dispute Comments Table
CREATE TABLE IF NOT EXISTS public.dispute_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.dispute_cases(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id),
  author_role text,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 22. Party Mode: Party Menus Table
CREATE TABLE IF NOT EXISTS public.party_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  min_guests integer NOT NULL DEFAULT 8,
  advance_notice_hours integer NOT NULL DEFAULT 48,
  packages jsonb NOT NULL DEFAULT '[]'::jsonb,
  dishes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT party_menus_kitchen_id_key UNIQUE (kitchen_id)
);

-- Enable RLS on party_menus
ALTER TABLE public.party_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to party menus"
  ON public.party_menus FOR SELECT
  USING (true);

CREATE POLICY "Allow chefs to manage their kitchen party menu"
  ON public.party_menus FOR ALL
  USING (auth.uid() IN (
    SELECT chef_user_id FROM public.kitchens WHERE id = kitchen_id
  ));

-- Add party fields to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_party_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS party_booking_date timestamptz,
  ADD COLUMN IF NOT EXISTS guest_count integer,
  ADD COLUMN IF NOT EXISTS selected_pack_name text,
  ADD COLUMN IF NOT EXISTS per_head_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_dishes jsonb DEFAULT '[]'::jsonb;

