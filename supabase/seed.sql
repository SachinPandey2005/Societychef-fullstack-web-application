-- HomeChef (Society Chef) Comprehensive CRM Setup & Mock Data Seed SQL
-- Creates all tables IF NOT EXISTS, then populates comprehensive mock data with valid Hexadecimal UUIDs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: SCHEMA CREATION (IF NOT EXISTS)
-- ============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  email text,
  name text,
  role text NOT NULL,
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
  order_code text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.profiles(id),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id),
  status text NOT NULL DEFAULT 'PLACED',
  delivery_method text NOT NULL DEFAULT 'DELIVERY_PARTNER',
  delivery_partner_id uuid REFERENCES public.delivery_partners(id),
  delivery_fee numeric NOT NULL DEFAULT 0,
  item_total numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  taxes numeric NOT NULL DEFAULT 0,
  platform_commission numeric DEFAULT 0,
  net_chef_earnings numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  delivery_address jsonb,
  allergy_tags text[] NOT NULL DEFAULT '{}',
  allergy_other_text text,
  payment_status text NOT NULL DEFAULT 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  dish_id uuid NOT NULL REFERENCES public.dishes(id),
  dish_name_snapshot text NOT NULL,
  price_snapshot numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

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

-- Ensure missing columns are added if tables already existed from prior schema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS lng numeric;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS state text;

ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS chef_name text;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS society_id uuid;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS tower text;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS flat text;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS hide_identity boolean DEFAULT false;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS default_lead_time_minutes integer DEFAULT 120;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS bank_status text DEFAULT 'pending';
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS hygiene_status text DEFAULT 'pending';
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS is_top_rated boolean DEFAULT false;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.kitchens ADD COLUMN IF NOT EXISTS profile_image text;

ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS diet_type text;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS prep_time_minutes integer DEFAULT 120;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;

ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS full_address text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS vehicle_type text;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS status text DEFAULT 'OFFLINE';
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS current_latitude numeric;
ALTER TABLE public.delivery_partners ADD COLUMN IF NOT EXISTS current_longitude numeric;

ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS total_sales numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS platform_commission numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS gateway_fees numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS net_payable numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS taxes numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS refund_adjustments numeric DEFAULT 0;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS period_end date;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'DELIVERY_PARTNER';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_partner_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_total numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS taxes numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS grand_total numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_commission numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS net_chef_earnings numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS allergy_tags text[] DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS allergy_other_text text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS wallet_type text;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0.00;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS consumer_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS kitchen_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment text;

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value numeric;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_value numeric DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount numeric;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS ends_at timestamptz;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS status text DEFAULT 'OPEN';

ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS refund_code text;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS kitchen_id uuid;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING';
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS requested_by uuid;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS processed_by uuid;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS refund_reference text;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS gateway_refund_id text;
ALTER TABLE public.refunds ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS adjustment_code text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS adjustment_type text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS target_type text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS target_id uuid;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS entry_type text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS requested_by uuid;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS reference_entity_type text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS reference_entity_id text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS supporting_notes text;
ALTER TABLE public.financial_adjustments ADD COLUMN IF NOT EXISTS status text DEFAULT 'APPROVED';

ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS dispute_code text;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS order_id uuid;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS kitchen_id uuid;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING';
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS priority text DEFAULT 'MEDIUM';
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS assigned_agent_id uuid;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS resolution_notes text;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS resolution_time_minutes integer;
ALTER TABLE public.dispute_cases ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

ALTER TABLE public.dispute_comments ADD COLUMN IF NOT EXISTS dispute_id uuid;
ALTER TABLE public.dispute_comments ADD COLUMN IF NOT EXISTS author_id uuid;
ALTER TABLE public.dispute_comments ADD COLUMN IF NOT EXISTS author_role text;
ALTER TABLE public.dispute_comments ADD COLUMN IF NOT EXISTS comment text;
ALTER TABLE public.dispute_comments ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false;

-- Enable Row Level Security (RLS) on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_comments ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- PART 2: MOCK DATA INSERTION (VALID HEX UUIDs)
-- ============================================================================

-- 1. Societies (20 Records)
INSERT INTO public.societies (id, name, city, lat, lng, address, state, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'Green Valley Heights', 'Bengaluru', 12.9279, 77.6271, 'Bellandur Main Road', 'Karnataka', now() - interval '90 days'),
('10000000-0000-0000-0000-000000000002', 'Sun City Apartments', 'Bengaluru', 12.9352, 77.6245, 'Sarjapur Outer Ring Road', 'Karnataka', now() - interval '88 days'),
('10000000-0000-0000-0000-000000000003', 'Prestige Enclave', 'Bengaluru', 12.9716, 77.5946, 'Whitefield', 'Karnataka', now() - interval '85 days'),
('10000000-0000-0000-0000-000000000004', 'Royal Palms', 'Mumbai', 19.1578, 72.8856, 'Aarey Milk Colony, Goregaon East', 'Maharashtra', now() - interval '80 days'),
('10000000-0000-0000-0000-000000000005', 'Sobha Forest View', 'Bengaluru', 12.8711, 77.5350, 'Kanakapura Road', 'Karnataka', now() - interval '78 days'),
('10000000-0000-0000-0000-000000000006', 'Godrej Woods', 'Noida', 28.5355, 77.3910, 'Sector 43, Noida', 'NCR', now() - interval '75 days'),
('10000000-0000-0000-0000-000000000007', 'Brigade Meadows', 'Bengaluru', 12.8214, 77.5612, 'Kanakapura Main Road', 'Karnataka', now() - interval '72 days'),
('10000000-0000-0000-0000-000000000008', 'DLF Phase 5', 'Gurugram', 28.4595, 77.0266, 'Golf Course Road', 'NCR', now() - interval '70 days'),
('10000000-0000-0000-0000-000000000009', 'Tata Primanti', 'Gurugram', 28.4089, 77.0425, 'Sector 72', 'NCR', now() - interval '68 days'),
('10000000-0000-0000-0000-000000000010', 'Mahindra Eden', 'Bengaluru', 12.8845, 77.5510, 'Kanakapura Road', 'Karnataka', now() - interval '65 days'),
('10000000-0000-0000-0000-000000000011', 'Emaar Palm Heights', 'Gurugram', 28.3980, 76.9740, 'Sector 77', 'NCR', now() - interval '60 days'),
('10000000-0000-0000-0000-000000000012', 'Puravankara Atmosphere', 'Bengaluru', 13.0645, 77.5980, 'Thanisandra', 'Karnataka', now() - interval '58 days'),
('10000000-0000-0000-0000-000000000013', 'Salarpuria Sattva', 'Hyderabad', 17.4399, 78.3809, 'Hitec City', 'Telangana', now() - interval '55 days'),
('10000000-0000-0000-0000-000000000014', 'Shapoorji Park', 'Pune', 18.5204, 73.8567, 'Bavdhan', 'Maharashtra', now() - interval '50 days'),
('10000000-0000-0000-0000-000000000015', 'Mantri Elegance', 'Bengaluru', 12.8950, 77.6010, 'BG Road', 'Karnataka', now() - interval '45 days'),
('10000000-0000-0000-0000-000000000016', 'Lodha Palava', 'Thane', 19.1600, 73.0800, 'Dombivli East', 'Maharashtra', now() - interval '40 days'),
('10000000-0000-0000-0000-000000000017', 'Oberoi Realty', 'Mumbai', 19.1700, 72.8600, 'Goregaon East', 'Maharashtra', now() - interval '35 days'),
('10000000-0000-0000-0000-000000000018', 'Hiranandani Gardens', 'Mumbai', 19.1197, 72.9050, 'Powai', 'Maharashtra', now() - interval '30 days'),
('10000000-0000-0000-0000-000000000019', 'Kalpataru Horizon', 'Mumbai', 19.0176, 72.8300, 'Worli', 'Maharashtra', now() - interval '25 days'),
('10000000-0000-0000-0000-000000000020', 'Adani Shantigram', 'Ahmedabad', 23.1400, 72.5400, 'SG Highway', 'Gujarat', now() - interval '20 days')
ON CONFLICT (id) DO NOTHING;

-- 2. Profiles (Consumers, Chefs, Delivery Partners, Admin)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

INSERT INTO public.profiles (id, phone, email, name, role, status, created_at) VALUES
-- Consumers (20)
('20000000-0000-0000-0000-000000000001', '+919876500001', 'rahul@example.com', 'Rahul Sharma', 'consumer', 'active', now() - interval '85 days'),
('20000000-0000-0000-0000-000000000002', '+919876500002', 'priya@example.com', 'Priya Verma', 'consumer', 'active', now() - interval '84 days'),
('20000000-0000-0000-0000-000000000003', '+919876500003', 'amitav@example.com', 'Amitav Das', 'consumer', 'active', now() - interval '83 days'),
('20000000-0000-0000-0000-000000000004', '+919876500004', 'sneha@example.com', 'Sneha Reddy', 'consumer', 'active', now() - interval '80 days'),
('20000000-0000-0000-0000-000000000005', '+919876500005', 'vikram@example.com', 'Vikram Malhotra', 'consumer', 'active', now() - interval '78 days'),
('20000000-0000-0000-0000-000000000006', '+919876500006', 'ananya@example.com', 'Ananya Iyer', 'consumer', 'active', now() - interval '75 days'),
('20000000-0000-0000-0000-000000000007', '+919876500007', 'rohan@example.com', 'Rohan Gupta', 'consumer', 'active', now() - interval '72 days'),
('20000000-0000-0000-0000-000000000008', '+919876500008', 'neha@example.com', 'Neha Kapoor', 'consumer', 'active', now() - interval '70 days'),
('20000000-0000-0000-0000-000000000009', '+919876500009', 'karan@example.com', 'Karan Patel', 'consumer', 'active', now() - interval '68 days'),
('20000000-0000-0000-0000-000000000010', '+919876500010', 'pooja@example.com', 'Pooja Nair', 'consumer', 'active', now() - interval '65 days'),
('20000000-0000-0000-0000-000000000011', '+919876500011', 'siddharth@example.com', 'Siddharth Joshi', 'consumer', 'active', now() - interval '60 days'),
('20000000-0000-0000-0000-000000000012', '+919876500012', 'meera@example.com', 'Meera Banerji', 'consumer', 'active', now() - interval '55 days'),
('20000000-0000-0000-0000-000000000013', '+919876500013', 'aditya@example.com', 'Aditya Rao', 'consumer', 'active', now() - interval '50 days'),
('20000000-0000-0000-0000-000000000014', '+919876500014', 'divya@example.com', 'Divya Saxena', 'consumer', 'active', now() - interval '45 days'),
('20000000-0000-0000-0000-000000000015', '+919876500015', 'varun@example.com', 'Varun Mehta', 'consumer', 'active', now() - interval '40 days'),
('20000000-0000-0000-0000-000000000016', '+919876500016', 'riya@example.com', 'Riya Sen', 'consumer', 'active', now() - interval '35 days'),
('20000000-0000-0000-0000-000000000017', '+919876500017', 'gaurav@example.com', 'Gaurav Kumar', 'consumer', 'active', now() - interval '30 days'),
('20000000-0000-0000-0000-000000000018', '+919876500018', 'swati@example.com', 'Swati Deshmukh', 'consumer', 'active', now() - interval '25 days'),
('20000000-0000-0000-0000-000000000019', '+919876500019', 'tarun@example.com', 'Tarun Bhatia', 'consumer', 'active', now() - interval '20 days'),
('20000000-0000-0000-0000-000000000020', '+919876500020', 'kavita@example.com', 'Kavita Singh', 'consumer', 'inactive', now() - interval '15 days'),

-- Chefs (20)
('30000000-0000-0000-0000-000000000001', '+919876500101', 'sarita@example.com', 'Chef Sarita Devi', 'chef', 'active', now() - interval '85 days'),
('30000000-0000-0000-0000-000000000002', '+919876500102', 'harish@example.com', 'Chef Harish Rawat', 'chef', 'active', now() - interval '84 days'),
('30000000-0000-0000-0000-000000000003', '+919876500103', 'sunita@example.com', 'Chef Sunita Rao', 'chef', 'active', now() - interval '82 days'),
('30000000-0000-0000-0000-000000000004', '+919876500104', 'sanjay@example.com', 'Chef Sanjay Thapar', 'chef', 'active', now() - interval '80 days'),
('30000000-0000-0000-0000-000000000005', '+919876500105', 'meenakshi@example.com', 'Chef Meenakshi Sundaram', 'chef', 'active', now() - interval '75 days'),
('30000000-0000-0000-0000-000000000006', '+919876500106', 'rajeshwari@example.com', 'Chef Rajeshwari Bai', 'chef', 'active', now() - interval '72 days'),
('30000000-0000-0000-0000-000000000007', '+919876500107', 'tarun.c@example.com', 'Chef Tarun Chatterji', 'chef', 'active', now() - interval '70 days'),
('30000000-0000-0000-0000-000000000008', '+919876500108', 'gurpreet@example.com', 'Chef Gurpreet Kaur', 'chef', 'active', now() - interval '65 days'),
('30000000-0000-0000-0000-000000000009', '+919876500109', 'shalini@example.com', 'Chef Shalini Saxena', 'chef', 'active', now() - interval '60 days'),
('30000000-0000-0000-0000-000000000010', '+919876500110', 'anand@example.com', 'Chef Anand Ahuja', 'chef', 'active', now() - interval '55 days'),
('30000000-0000-0000-0000-000000000011', '+919876500111', 'smita@example.com', 'Chef Smita Kulkarni', 'chef', 'active', now() - interval '50 days'),
('30000000-0000-0000-0000-000000000012', '+919876500112', 'ramesh.n@example.com', 'Chef Ramesh Nair', 'chef', 'active', now() - interval '45 days'),
('30000000-0000-0000-0000-000000000013', '+919876500113', 'vandana@example.com', 'Chef Vandana Jain', 'chef', 'active', now() - interval '40 days'),
('30000000-0000-0000-0000-000000000014', '+919876500114', 'deepa@example.com', 'Chef Deepa Menon', 'chef', 'active', now() - interval '35 days'),
('30000000-0000-0000-0000-000000000015', '+919876500115', 'manish@example.com', 'Chef Manish Tandon', 'chef', 'active', now() - interval '30 days'),
('30000000-0000-0000-0000-000000000016', '+919876500116', 'kavita.r@example.com', 'Chef Kavita Reddy', 'chef', 'active', now() - interval '25 days'),
('30000000-0000-0000-0000-000000000017', '+919876500117', 'pradeep@example.com', 'Chef Pradeep Roy', 'chef', 'active', now() - interval '20 days'),
('30000000-0000-0000-0000-000000000018', '+919876500118', 'alka@example.com', 'Chef Alka Upadhyay', 'chef', 'active', now() - interval '15 days'),
('30000000-0000-0000-0000-000000000019', '+919876500119', 'biren@example.com', 'Chef Biren Patel', 'chef', 'active', now() - interval '10 days'),
('30000000-0000-0000-0000-000000000020', '+919876500120', 'archana@example.com', 'Chef Archana Gautam', 'chef', 'inactive', now() - interval '5 days'),

-- Delivery Partners (5)
('40000000-0000-0000-0000-000000000001', '+919876500201', 'deliv1@example.com', 'Ramesh Kumar', 'DELIVERY_PARTNER', 'active', now() - interval '85 days'),
('40000000-0000-0000-0000-000000000002', '+919876500202', 'deliv2@example.com', 'Suresh Yadav', 'DELIVERY_PARTNER', 'active', now() - interval '80 days'),
('40000000-0000-0000-0000-000000000003', '+919876500203', 'deliv3@example.com', 'Dinesh Chand', 'DELIVERY_PARTNER', 'active', now() - interval '75 days'),
('40000000-0000-0000-0000-000000000004', '+919876500204', 'deliv4@example.com', 'Mahesh Giri', 'DELIVERY_PARTNER', 'active', now() - interval '70 days'),
('40000000-0000-0000-0000-000000000005', '+919876500205', 'deliv5@example.com', 'Vijay Pal', 'DELIVERY_PARTNER', 'active', now() - interval '65 days')
ON CONFLICT (id) DO NOTHING;

-- 3. Kitchens (5 Records)
INSERT INTO public.kitchens (id, chef_user_id, name, chef_name, address, society_id, default_lead_time_minutes, bank_status, hygiene_status, is_verified, is_top_rated, is_live, created_at) VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Grandma Spice Box', 'Chef Sarita Devi', 'Flat 201, Green Valley', '10000000-0000-0000-0000-000000000001', 45, 'verified', 'verified', true, true, true, now() - interval '85 days'),
('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Punjabi Rasoi Express', 'Chef Harish Rawat', 'Flat 302, Sun City', '10000000-0000-0000-0000-000000000002', 30, 'verified', 'verified', true, true, true, now() - interval '84 days'),
('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'South Tiffin House', 'Chef Sunita Rao', 'Flat 104, Prestige Enclave', '10000000-0000-0000-0000-000000000003', 25, 'verified', 'verified', true, false, true, now() - interval '82 days'),
('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Bong Connection', 'Chef Sanjay Thapar', 'Flat 501, Royal Palms', '10000000-0000-0000-0000-000000000004', 60, 'verified', 'verified', true, true, true, now() - interval '80 days'),
('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'Healthy Bowls & Salads', 'Chef Meenakshi Sundaram', 'Flat 602, Sobha Forest', '10000000-0000-0000-0000-000000000005', 30, 'verified', 'verified', true, false, true, now() - interval '75 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Dishes (Key samples across categories)
INSERT INTO public.dishes (id, kitchen_id, name, category, diet_type, price, prep_time_minutes, is_available, created_at) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Special Aloo Paratha with Curd', 'Breakfast', 'VEG', 120, 30, true, now() - interval '80 days'),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Butter Chicken Thali', 'Lunch', 'NONVEG', 280, 45, true, now() - interval '80 days'),
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'Paneer Butter Masala Meal', 'Lunch', 'VEG', 240, 40, true, now() - interval '80 days'),
('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'South Indian Idli Sambhar (4 pcs)', 'Breakfast', 'VEG', 90, 20, true, now() - interval '80 days'),
('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', 'High Protein Grilled Chicken Salad', 'Healthy', 'NONVEG', 260, 30, true, now() - interval '80 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Addresses
INSERT INTO public.addresses (id, consumer_id, label, full_address, latitude, longitude, is_default, created_at) VALUES
('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Home', 'Flat 101, Tower A, Green Valley Heights, Bellandur, Bengaluru', 12.9279, 77.6271, true, now() - interval '80 days'),
('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Work', 'Flat 402, Sun City Apartments, Sarjapur Road, Bengaluru', 12.9352, 77.6245, true, now() - interval '80 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Delivery Partners
INSERT INTO public.delivery_partners (id, user_id, vehicle_type, status, current_latitude, current_longitude, created_at) VALUES
('45000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'EV Bike', 'ONLINE', 12.9280, 77.6270, now() - interval '80 days'),
('45000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Motorcycle', 'DELIVERING', 12.9350, 77.6240, now() - interval '80 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Orders & Order Items
INSERT INTO public.orders (id, order_code, customer_id, kitchen_id, status, delivery_method, delivery_partner_id, delivery_fee, item_total, discount_amount, taxes, platform_commission, net_chef_earnings, grand_total, payment_status, razorpay_order_id, razorpay_payment_id, created_at) VALUES
('80000000-0000-0000-0000-000000000001', 'ORD-9001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'DELIVERED', 'DELIVERY_PARTNER', '45000000-0000-0000-0000-000000000001', 35, 400, 40, 20, 48, 312, 415, 'paid', 'order_rzp_9001', 'pay_rzp_9001', now() - interval '10 days'),
('80000000-0000-0000-0000-000000000002', 'ORD-9002', '20000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'DELIVERED', 'DELIVERY_PARTNER', '45000000-0000-0000-0000-000000000002', 35, 240, 0, 12, 28, 212, 287, 'paid', 'order_rzp_9002', 'pay_rzp_9002', now() - interval '8 days'),
('80000000-0000-0000-0000-000000000003', 'ORD-9003', '20000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'CANCELLED', 'DELIVERY_PARTNER', '45000000-0000-0000-0000-000000000001', 35, 180, 0, 9, 21, 159, 224, 'REFUNDED', 'order_rzp_9003', 'pay_rzp_9003', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (id, order_id, dish_id, dish_name_snapshot, price_snapshot, quantity, created_at) VALUES
('85000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Special Aloo Paratha with Curd', 120, 1, now() - interval '10 days'),
('85000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', 'Butter Chicken Thali', 280, 1, now() - interval '10 days'),
('85000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', 'Paneer Butter Masala Meal', 240, 1, now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

-- 8. Settlements
INSERT INTO public.settlements (id, kitchen_id, total_sales, platform_commission, gateway_fees, taxes, refund_adjustments, net_payable, status, settlement_mode, period_start, period_end, created_at) VALUES
('90000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 3500, 350, 70, 63, 0, 3017, 'PAID', 'weekly', CURRENT_DATE - 14, CURRENT_DATE - 7, now() - interval '7 days'),
('90000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 2800, 280, 56, 50, 0, 2414, 'PENDING', 'weekly', CURRENT_DATE - 7, CURRENT_DATE, now())
ON CONFLICT (id) DO NOTHING;

-- 9. Wallets & Wallet Transactions
INSERT INTO public.wallets (id, profile_id, role, wallet_type, balance, currency, status, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'consumer', 'CONSUMER', 450, 'INR', 'ACTIVE', now() - interval '80 days'),
('a0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'chef', 'CHEF', 3017, 'INR', 'ACTIVE', now() - interval '80 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallet_transactions (id, wallet_id, amount, type, source, reference_id, description, created_at) VALUES
('a5000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 500, 'CREDIT', 'TOPUP', 'topup_01', 'Added funds via UPI', now() - interval '15 days'),
('a5000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 3017, 'CREDIT', 'SETTLEMENT', '90000000-0000-0000-0000-000000000001', 'Weekly Settlement Payout', now() - interval '7 days')
ON CONFLICT (id) DO NOTHING;

-- 10. Reviews & Notifications & Tickets
INSERT INTO public.reviews (id, order_id, consumer_id, kitchen_id, rating, comment, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 5, 'Authentic home-cooked taste, fresh and piping hot!', now() - interval '9 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notifications (id, profile_id, title, message, type, is_read, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Order Delivered 🛍️', 'Your order ORD-9001 from Grandma Spice Box has been delivered.', 'ORDER_STATUS', true, now() - interval '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tickets (id, profile_id, subject, description, status, created_at) VALUES
('d0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Refund Enquiry', 'Order ORD-9003 was cancelled, requesting timeline for bank refund.', 'IN_PROGRESS', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- 11. Phase 16: Refunds, Financial Adjustments & Disputes
INSERT INTO public.refunds (id, refund_code, order_id, customer_id, kitchen_id, payment_id, amount, type, reason, status, refund_reference, gateway_refund_id, created_at) VALUES
('e0000000-0000-0000-0000-000000000001', 'REF-9003', '80000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'pay_rzp_9003', 224, 'AUTOMATIC', 'Order Cancelled Before Prep', 'COMPLETED', 'ref_rzp_9003', 'rzp_ref_9003', now() - interval '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.financial_adjustments (id, adjustment_code, adjustment_type, target_type, target_id, amount, entry_type, reason, status, created_at) VALUES
('f0000000-0000-0000-0000-000000000001', 'ADJ-9001', 'COMMISSION_CORRECTION', 'CHEF', '50000000-0000-0000-0000-000000000001', 250, 'CREDIT', 'Weekly performance incentive bonus', 'APPROVED', now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dispute_cases (id, dispute_code, order_id, customer_id, kitchen_id, category, status, priority, description, resolution_notes, created_at) VALUES
('f5000000-0000-0000-0000-000000000001', 'DISP-9001', '80000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'MISSING_REFUND', 'RESOLVED', 'HIGH', 'Customer queried delayed cancellation refund status.', 'Processed full automated refund via Razorpay reference rzp_ref_9003.', now() - interval '4 days')
ON CONFLICT (id) DO NOTHING;

-- 12. Party Menus Seed Data
INSERT INTO public.party_menus (id, kitchen_id, is_enabled, min_guests, advance_notice_hours, packages, dishes, created_at) VALUES
('fa000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', true, 8, 48, 
  '[{"id":"jalsa","name":"JALSA","description":"Full course celebration feast","minGuests":8,"basePricePerHead":280,"categoryCaps":{"starters":2,"mains":2,"breads":2,"sweets":1}},{"id":"utsav","name":"UTSAV","description":"Grand royal party banquet","minGuests":15,"basePricePerHead":450,"categoryCaps":{"starters":3,"mains":3,"breads":3,"sweets":2}}]'::jsonb,
  '[{"id":"pd1","name":"Paneer Tikka","category":"Starters","extraChargePerHead":0},{"id":"pd2","name":"Hara Bhara Kebab","category":"Starters","extraChargePerHead":0},{"id":"pd3","name":"Dal Makhani","category":"Mains","extraChargePerHead":0},{"id":"pd4","name":"Paneer Butter Masala","category":"Mains","extraChargePerHead":0},{"id":"pd5","name":"Butter Naan","category":"Breads","extraChargePerHead":0},{"id":"pd6","name":"Missi Roti","category":"Breads","extraChargePerHead":0},{"id":"pd7","name":"Gulab Jamun","category":"Sweets","extraChargePerHead":0},{"id":"pd8","name":"Rasmalai","category":"Sweets","extraChargePerHead":30}]'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;
