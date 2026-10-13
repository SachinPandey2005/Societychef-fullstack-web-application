-- Local/Neon port of the live Supabase schema (dumped 2026-09-22, re-confirmed
-- by the user on 2026-10-02). Structural port only: tables, columns, defaults,
-- PRIMARY KEY/CHECK constraints, and foreign keys. Row Level Security is
-- deliberately NOT ported here — see supabase/local/README.md.
--
-- Foreign keys are added in a second pass (bottom of file) so table creation
-- order never has to match the dependency graph.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  phone text,
  name text,
  display_name text,
  society text,
  role text DEFAULT 'consumer'::text,
  roles text[] DEFAULT ARRAY['consumer'::text],
  active_role text DEFAULT 'consumer'::text,
  chef_profile_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  flat text,
  status text DEFAULT 'active'::text,
  email text,
  latitude numeric,
  longitude numeric,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.kitchens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chef_user_id uuid,
  name text NOT NULL,
  address text,
  bio text,
  specialty text,
  is_verified boolean DEFAULT false,
  is_top_rated boolean DEFAULT false,
  profile_image_url text,
  gallery_urls text[] DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone DEFAULT now(),
  cover_image text,
  profile_image text,
  gallery text[] DEFAULT ARRAY[]::text[],
  videos text[] DEFAULT ARRAY[]::text[],
  kitchen_info jsonb DEFAULT '{}'::jsonb,
  story_prompts jsonb DEFAULT '[]'::jsonb,
  hygiene_details jsonb DEFAULT '[]'::jsonb,
  trust_badges jsonb DEFAULT '[]'::jsonb,
  stats jsonb DEFAULT '{}'::jsonb,
  chef_name text,
  society_id uuid,
  tower text,
  flat text,
  hide_identity boolean DEFAULT false,
  default_lead_time_minutes integer DEFAULT 120,
  bank_status text DEFAULT 'pending'::text,
  hygiene_status text DEFAULT 'pending'::text,
  is_live boolean DEFAULT false,
  CONSTRAINT kitchens_pkey PRIMARY KEY (id)
);

CREATE TABLE public.dishes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kitchen_id uuid,
  name text NOT NULL,
  category text DEFAULT 'Homestyle'::text,
  price numeric NOT NULL,
  diet_type text DEFAULT 'VEG'::text,
  prep_time_minutes integer DEFAULT 120,
  tags text[] DEFAULT ARRAY[]::text[],
  is_available boolean DEFAULT true,
  is_free boolean DEFAULT false,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dishes_pkey PRIMARY KEY (id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_code text UNIQUE,
  customer_id uuid,
  kitchen_id uuid,
  status text DEFAULT 'PLACED'::text,
  delivery_method text DEFAULT 'DELIVERY_PARTNER'::text,
  delivery_fee numeric DEFAULT 0,
  list_price numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  delivery_address text,
  allergy_tags text[] DEFAULT ARRAY[]::text[],
  allergy_other_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  delivery_partner_id uuid,
  item_total numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  taxes numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  platform_commission numeric DEFAULT 0,
  net_chef_earnings numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  payment_status text DEFAULT 'pending'::text,
  razorpay_order_id text,
  razorpay_payment_id text,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  dish_id uuid,
  dish_name_snapshot text,
  price_snapshot numeric,
  quantity integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

CREATE TABLE public.weekly_dishes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kitchen_id uuid,
  day text NOT NULL,
  dish_name text NOT NULL,
  category text DEFAULT 'Veg'::text,
  meal_type text DEFAULT 'Lunch'::text,
  price numeric NOT NULL,
  quantity integer DEFAULT 10,
  remaining_quantity integer DEFAULT 10,
  description text,
  close_time text DEFAULT '6:00 PM'::text,
  status text DEFAULT 'open'::text,
  week_start_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_dishes_pkey PRIMARY KEY (id)
);

CREATE TABLE public.chat_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  consumer_id uuid,
  kitchen_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_threads_pkey PRIMARY KEY (id)
);

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid,
  sender_id uuid,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE public.supply_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text DEFAULT 'kg'::text,
  price numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT supply_items_pkey PRIMARY KEY (id)
);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id text NOT NULL,
  kitchen_id text NOT NULL,
  kitchen_name text,
  dish_id text,
  dish_name text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  consumer_id uuid,
  customer_id uuid,
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);

CREATE TABLE public.societies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  lat numeric,
  lng numeric,
  address text,
  state text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT societies_pkey PRIMARY KEY (id)
);

CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  consumer_id uuid NOT NULL,
  label text NOT NULL,
  full_address text NOT NULL,
  latitude numeric,
  longitude numeric,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id)
);

CREATE TABLE public.delivery_partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_type text NOT NULL,
  status text NOT NULL DEFAULT 'OFFLINE'::text,
  current_latitude numeric,
  current_longitude numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  gender text,
  date_of_birth date,
  blood_group text,
  preferred_language text DEFAULT 'English'::text,
  profile_photo_url text,
  permanent_address text,
  current_address text,
  city text,
  state text,
  pincode text,
  landmark text,
  kyc_status text DEFAULT 'PENDING'::text CHECK (kyc_status = ANY (ARRAY['PENDING'::text, 'UNDER_REVIEW'::text, 'APPROVED'::text, 'REJECTED'::text, 'EXPIRED'::text])),
  rejection_reason text,
  experience_points integer DEFAULT 0,
  partner_level integer DEFAULT 1,
  CONSTRAINT delivery_partners_pkey PRIMARY KEY (id)
);

CREATE TABLE public.settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL,
  total_sales numeric NOT NULL DEFAULT 0,
  platform_commission numeric NOT NULL DEFAULT 0,
  gateway_fees numeric NOT NULL DEFAULT 0,
  taxes numeric NOT NULL DEFAULT 0,
  refund_adjustments numeric NOT NULL DEFAULT 0,
  net_payable numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING'::text,
  settlement_mode text NOT NULL DEFAULT 'weekly'::text,
  period_start date,
  period_end date,
  expected_at timestamp with time zone,
  held_transaction_id uuid,
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT settlements_pkey PRIMARY KEY (id)
);

CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  user_id uuid,
  role text CHECK (role = ANY (ARRAY['consumer'::text, 'chef'::text])),
  wallet_type text CHECK (wallet_type = ANY (ARRAY['CONSUMER'::text, 'CHEF'::text, 'PLATFORM'::text])),
  balance numeric NOT NULL DEFAULT 0.00,
  currency text NOT NULL DEFAULT 'INR'::text,
  status text NOT NULL DEFAULT 'ACTIVE'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  wallet_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  source text,
  reference_id text,
  order_id uuid,
  payment_id uuid,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text])),
  discount_value numeric NOT NULL,
  min_order_value numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category text CHECK (category = ANY (ARRAY['DELIVERY_ISSUE'::text, 'PICKUP_ISSUE'::text, 'CUSTOMER_ISSUE'::text, 'CHEF_ISSUE'::text, 'PAYMENT_ISSUE'::text, 'WALLET_ISSUE'::text, 'TECHNICAL_ISSUE'::text, 'ACCOUNT_ISSUE'::text, 'SAFETY_ISSUE'::text, 'EMERGENCY'::text, 'OTHER'::text])),
  priority text DEFAULT 'MEDIUM'::text CHECK (priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'URGENT'::text])),
  order_id uuid,
  assigned_agent_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tickets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  refund_code text NOT NULL UNIQUE,
  order_id uuid,
  customer_id uuid,
  kitchen_id uuid,
  payment_id text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  type text NOT NULL CHECK (type = ANY (ARRAY['FULL'::text, 'PARTIAL'::text, 'MANUAL'::text, 'AUTOMATIC'::text])),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'PROCESSING'::text, 'COMPLETED'::text, 'FAILED'::text, 'REJECTED'::text])),
  requested_by uuid,
  approved_by uuid,
  processed_by uuid,
  refund_reference text,
  gateway_refund_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT refunds_pkey PRIMARY KEY (id)
);

CREATE TABLE public.financial_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  adjustment_code text NOT NULL UNIQUE,
  adjustment_type text NOT NULL CHECK (adjustment_type = ANY (ARRAY['COMMISSION_CORRECTION'::text, 'SETTLEMENT_CORRECTION'::text, 'WALLET_CORRECTION'::text, 'TAX_ADJUSTMENT'::text, 'DELIVERY_CHARGE_ADJUSTMENT'::text, 'MANUAL_ACCOUNTING_ENTRY'::text, 'REFUND_ADJUSTMENT'::text, 'SETTLEMENT_REVERSAL'::text, 'PENALTY'::text, 'CHARGEBACK'::text, 'BONUS'::text, 'INCENTIVE'::text])),
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['CHEF'::text, 'CUSTOMER'::text, 'PLATFORM'::text])),
  target_id uuid,
  amount numeric NOT NULL,
  entry_type text NOT NULL CHECK (entry_type = ANY (ARRAY['CREDIT'::text, 'DEBIT'::text])),
  reason text NOT NULL,
  requested_by uuid,
  approved_by uuid,
  reference_entity_type text,
  reference_entity_id text,
  supporting_notes text,
  status text NOT NULL DEFAULT 'APPROVED'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT financial_adjustments_pkey PRIMARY KEY (id)
);

CREATE TABLE public.dispute_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispute_code text NOT NULL UNIQUE,
  order_id uuid,
  customer_id uuid,
  kitchen_id uuid,
  category text NOT NULL CHECK (category = ANY (ARRAY['INCORRECT_CHARGE'::text, 'MISSING_REFUND'::text, 'DUPLICATE_PAYMENT'::text, 'WRONG_SETTLEMENT'::text, 'WRONG_COMMISSION'::text, 'FAILED_PAYOUT'::text, 'FRAUD_REVIEW'::text])),
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'INVESTIGATING'::text, 'RESOLVED'::text, 'REJECTED'::text])),
  priority text NOT NULL DEFAULT 'MEDIUM'::text CHECK (priority = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text, 'URGENT'::text])),
  assigned_agent_id uuid,
  description text NOT NULL,
  resolution_notes text,
  resolution_time_minutes integer,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispute_cases_pkey PRIMARY KEY (id)
);

CREATE TABLE public.dispute_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL,
  author_id uuid,
  author_role text,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispute_comments_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['aadhaar_front'::text, 'aadhaar_back'::text, 'pan_card'::text, 'license_front'::text, 'license_back'::text, 'passport'::text, 'selfie'::text])),
  document_url text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  expiry_date date,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partner_documents_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  vehicle_type text NOT NULL CHECK (vehicle_type = ANY (ARRAY['BIKE'::text, 'SCOOTER'::text, 'CYCLE'::text, 'EV'::text, 'WALKING'::text])),
  vehicle_number text CHECK (vehicle_number IS NULL OR vehicle_number = ''::text OR vehicle_number ~* '^[a-z0-9\s\-]+$'::text),
  rc_url text NOT NULL,
  insurance_url text NOT NULL,
  puc_url text,
  photo_url text,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partner_vehicles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  holder_name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text CHECK (ifsc_code IS NULL OR ifsc_code = ''::text OR ifsc_code ~* '^[A-Z]{4}0[A-Z0-9]{6}$'::text),
  upi_id text,
  cheque_url text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partner_bank_accounts_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_emergency_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  primary_name text NOT NULL,
  primary_phone text NOT NULL,
  primary_relationship text NOT NULL,
  secondary_name text,
  secondary_phone text,
  secondary_relationship text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partner_emergency_contacts_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_society_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  society_id uuid NOT NULL,
  tower_coverage text[] DEFAULT '{}'::text[],
  delivery_radius_km numeric DEFAULT 2.0,
  working_zone text,
  shift_timing_start text,
  shift_timing_end text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partner_society_assignments_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_verification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  action text NOT NULL,
  rejection_reason text,
  performed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT partner_verification_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.delivery_partner_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  overall_rating numeric DEFAULT 5.00,
  acceptance_rate numeric DEFAULT 100.00,
  completion_rate numeric DEFAULT 100.00,
  on_time_delivery_rate numeric DEFAULT 100.00,
  avg_delivery_time_minutes integer DEFAULT 0,
  today_score integer DEFAULT 100,
  weekly_score integer DEFAULT 100,
  monthly_score integer DEFAULT 100,
  lifetime_deliveries integer DEFAULT 0,
  days_worked integer DEFAULT 0,
  hours_online numeric DEFAULT 0.00,
  shift_completion_rate numeric DEFAULT 100.00,
  late_starts_count integer DEFAULT 0,
  break_compliance_rate numeric DEFAULT 100.00,
  package_handling_score numeric DEFAULT 100.00,
  customer_satisfaction_score numeric DEFAULT 100.00,
  order_accuracy_score numeric DEFAULT 100.00,
  professionalism_score numeric DEFAULT 100.00,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_partner_metrics_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  badge_code text NOT NULL,
  title text NOT NULL,
  description text,
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_badges_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['DAILY'::text, 'WEEKLY'::text, 'MONTHLY'::text])),
  target_deliveries integer NOT NULL,
  completed_deliveries integer DEFAULT 0,
  projected_earnings numeric NOT NULL DEFAULT 0.00,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_targets_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_incentives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  incentive_type text NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'ELIGIBLE'::text CHECK (status = ANY (ARRAY['ELIGIBLE'::text, 'INELIGIBLE'::text, 'CLAIMED'::text])),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_incentives_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  scope text NOT NULL CHECK (scope = ANY (ARRAY['SOCIETY'::text, 'CITY'::text, 'REGION'::text, 'COMPANY'::text])),
  rank integer NOT NULL,
  score integer NOT NULL,
  completed_deliveries integer DEFAULT 0,
  rating numeric DEFAULT 5.00,
  as_of_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_leaderboard_pkey PRIMARY KEY (id)
);

CREATE TABLE public.reward_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type = ANY (ARRAY['COUPON'::text, 'GIFT_VOUCHER'::text, 'RECOGNITION_CERTIFICATE'::text])),
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reward_catalog_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  reward_points_balance integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_rewards_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  reward_catalog_id uuid,
  code text NOT NULL,
  status text DEFAULT 'ISSUED'::text CHECK (status = ANY (ARRAY['ISSUED'::text, 'REDEEMED'::text, 'EXPIRED'::text])),
  redeemed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_redemptions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_penalties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  penalty_type text NOT NULL,
  amount numeric DEFAULT 0.00,
  reason text NOT NULL,
  warning_issued boolean DEFAULT false,
  status text DEFAULT 'APPLIED'::text CHECK (status = ANY (ARRAY['APPLIED'::text, 'APPEALED'::text, 'WAIVED'::text])),
  appeal_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_penalties_pkey PRIMARY KEY (id)
);

CREATE TABLE public.learning_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 5,
  category text DEFAULT 'BEST_PRACTICES'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT learning_videos_pkey PRIMARY KEY (id)
);

CREATE TABLE public.ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  media_url text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ticket_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  incident_type text NOT NULL CHECK (incident_type = ANY (ARRAY['ACCIDENT'::text, 'VEHICLE_BREAKDOWN'::text, 'CUSTOMER_MISCONDUCT'::text, 'CHEF_MISCONDUCT'::text, 'FOOD_DAMAGE'::text, 'ROAD_CLOSURE'::text, 'SAFETY_HAZARD'::text, 'MEDICAL_EMERGENCY'::text])),
  description text NOT NULL,
  evidence_url text,
  latitude numeric,
  longitude numeric,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_incidents_pkey PRIMARY KEY (id)
);

CREATE TABLE public.emergency_sos_alarms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  order_id uuid,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE'::text CHECK (status = ANY (ARRAY['ACTIVE'::text, 'RESOLVED'::text, 'FALSE_ALARM'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT emergency_sos_alarms_pkey PRIMARY KEY (id)
);

CREATE TABLE public.faq_kb (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category = ANY (ARRAY['ORDER_PROCESS'::text, 'PICKUP'::text, 'DELIVERY'::text, 'PAYMENTS'::text, 'WALLET'::text, 'APP_USAGE'::text, 'SAFETY'::text, 'TROUBLESHOOTING'::text])),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT faq_kb_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type = ANY (ARRAY['APP_FEEDBACK'::text, 'BUG_REPORT'::text, 'FEATURE_REQUEST'::text, 'GENERAL_SUGGESTION'::text])),
  description text NOT NULL,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'UNDER_REVIEW'::text, 'RESOLVED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_feedback_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_devices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  device_name text NOT NULL,
  os_type text NOT NULL,
  app_version text NOT NULL,
  device_token text,
  last_login_at timestamp with time zone DEFAULT now(),
  last_sync_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_devices_pkey PRIMARY KEY (id)
);

CREATE TABLE public.partner_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  language text DEFAULT 'en'::text CHECK (language = ANY (ARRAY['en'::text, 'hi'::text, 'kn'::text, 'ta'::text])),
  theme text DEFAULT 'light'::text CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  notifications_enabled boolean DEFAULT true,
  biometrics_enabled boolean DEFAULT false,
  location_preferences text DEFAULT 'ALWAYS'::text CHECK (location_preferences = ANY (ARRAY['ALWAYS'::text, 'WHILE_USING'::text, 'DISABLED'::text])),
  map_preferences text DEFAULT 'GOOGLE'::text CHECK (map_preferences = ANY (ARRAY['GOOGLE'::text, 'APPLE'::text, 'OSM'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT partner_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE public.compliance_docs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_type text NOT NULL UNIQUE CHECK (document_type = ANY (ARRAY['PRIVACY_POLICY'::text, 'TERMS_OF_SERVICE'::text, 'PARTNER_AGREEMENT'::text, 'LICENSES'::text])),
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT compliance_docs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.system_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid,
  event_type text NOT NULL,
  severity text DEFAULT 'INFO'::text CHECK (severity = ANY (ARRAY['INFO'::text, 'WARNING'::text, 'ERROR'::text, 'CRITICAL'::text])),
  description text NOT NULL,
  api_latency numeric,
  battery_level integer,
  gps_status text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.device_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT device_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  promotional_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id)
);

CREATE TABLE public.kitchen_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'REQUEST_RESUBMISSION'::text, 'SUSPENDED'::text])),
  documents_url text[],
  hygiene_records_url text[],
  verifier_id uuid,
  verification_notes text,
  verification_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT kitchen_verifications_pkey PRIMARY KEY (id)
);

CREATE TABLE public.verification_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT verification_requests_pkey PRIMARY KEY (id)
);

CREATE TABLE public.verification_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id uuid,
  status text NOT NULL,
  notes text,
  performed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT verification_history_pkey PRIMARY KEY (id)
);

CREATE TABLE public.delivery_partner_location (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  order_id uuid,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  heading numeric,
  speed numeric,
  battery_level integer,
  gps_provider text,
  captured_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT delivery_partner_location_pkey PRIMARY KEY (id)
);

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  module text NOT NULL,
  entity_type text,
  entity_id uuid,
  previous_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE public.delivery_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ASSIGNED'::text CHECK (status = ANY (ARRAY['ASSIGNED'::text, 'ACCEPTED'::text, 'REJECTED'::text, 'AT_PICKUP'::text, 'PICKED_UP'::text, 'OUT_FOR_DELIVERY'::text, 'REACHED_CUSTOMER'::text, 'DELIVERED'::text, 'CANCELLED'::text, 'FAILED'::text])),
  pickup_otp text NOT NULL,
  delivery_otp text NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  picked_up_at timestamp with time zone,
  delivered_at timestamp with time zone,
  CONSTRAINT delivery_assignments_pkey PRIMARY KEY (id)
);

CREATE TABLE public.delivery_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_tracking_pkey PRIMARY KEY (id)
);

CREATE TABLE public.delivery_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'PAID'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_earnings_pkey PRIMARY KEY (id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- Foreign keys (second pass — avoids table-creation ordering entirely)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.kitchens ADD CONSTRAINT kitchens_chef_user_id_fkey FOREIGN KEY (chef_user_id) REFERENCES public.profiles(id);
ALTER TABLE public.dishes ADD CONSTRAINT dishes_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.delivery_partners ADD CONSTRAINT delivery_partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.orders ADD CONSTRAINT fk_orders_delivery_partner FOREIGN KEY (delivery_partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.order_items ADD CONSTRAINT order_items_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id);
ALTER TABLE public.weekly_dishes ADD CONSTRAINT weekly_dishes_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.chat_threads ADD CONSTRAINT chat_threads_consumer_id_fkey FOREIGN KEY (consumer_id) REFERENCES public.profiles(id);
ALTER TABLE public.chat_threads ADD CONSTRAINT chat_threads_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id);
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);
ALTER TABLE public.addresses ADD CONSTRAINT addresses_consumer_id_fkey FOREIGN KEY (consumer_id) REFERENCES public.profiles(id);
ALTER TABLE public.settlements ADD CONSTRAINT settlements_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.wallets ADD CONSTRAINT wallets_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.profiles(id);
ALTER TABLE public.refunds ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.refunds ADD CONSTRAINT refunds_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id);
ALTER TABLE public.refunds ADD CONSTRAINT refunds_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.refunds ADD CONSTRAINT refunds_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id);
ALTER TABLE public.refunds ADD CONSTRAINT refunds_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id);
ALTER TABLE public.refunds ADD CONSTRAINT refunds_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.profiles(id);
ALTER TABLE public.financial_adjustments ADD CONSTRAINT financial_adjustments_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id);
ALTER TABLE public.financial_adjustments ADD CONSTRAINT financial_adjustments_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id);
ALTER TABLE public.dispute_cases ADD CONSTRAINT dispute_cases_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.dispute_cases ADD CONSTRAINT dispute_cases_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id);
ALTER TABLE public.dispute_cases ADD CONSTRAINT dispute_cases_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.dispute_cases ADD CONSTRAINT dispute_cases_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES public.profiles(id);
ALTER TABLE public.dispute_comments ADD CONSTRAINT dispute_comments_dispute_id_fkey FOREIGN KEY (dispute_id) REFERENCES public.dispute_cases(id);
ALTER TABLE public.dispute_comments ADD CONSTRAINT dispute_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.partner_documents ADD CONSTRAINT partner_documents_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_vehicles ADD CONSTRAINT partner_vehicles_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_bank_accounts ADD CONSTRAINT partner_bank_accounts_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_emergency_contacts ADD CONSTRAINT partner_emergency_contacts_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_society_assignments ADD CONSTRAINT partner_society_assignments_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_society_assignments ADD CONSTRAINT partner_society_assignments_society_id_fkey FOREIGN KEY (society_id) REFERENCES public.societies(id);
ALTER TABLE public.partner_verification_logs ADD CONSTRAINT partner_verification_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id);
ALTER TABLE public.partner_verification_logs ADD CONSTRAINT partner_verification_logs_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.delivery_partner_metrics ADD CONSTRAINT delivery_partner_metrics_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_badges ADD CONSTRAINT partner_badges_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_targets ADD CONSTRAINT partner_targets_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_incentives ADD CONSTRAINT partner_incentives_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_leaderboard ADD CONSTRAINT partner_leaderboard_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_rewards ADD CONSTRAINT partner_rewards_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_redemptions ADD CONSTRAINT partner_redemptions_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_redemptions ADD CONSTRAINT partner_redemptions_reward_catalog_id_fkey FOREIGN KEY (reward_catalog_id) REFERENCES public.reward_catalog(id);
ALTER TABLE public.partner_penalties ADD CONSTRAINT partner_penalties_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);
ALTER TABLE public.ticket_messages ADD CONSTRAINT ticket_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);
ALTER TABLE public.partner_incidents ADD CONSTRAINT partner_incidents_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_incidents ADD CONSTRAINT partner_incidents_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.emergency_sos_alarms ADD CONSTRAINT emergency_sos_alarms_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.emergency_sos_alarms ADD CONSTRAINT emergency_sos_alarms_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.partner_feedback ADD CONSTRAINT partner_feedback_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_devices ADD CONSTRAINT partner_devices_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.partner_settings ADD CONSTRAINT partner_settings_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.system_audit_logs ADD CONSTRAINT system_audit_logs_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.device_tokens ADD CONSTRAINT device_tokens_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
ALTER TABLE public.kitchen_verifications ADD CONSTRAINT kitchen_verifications_kitchen_id_fkey FOREIGN KEY (kitchen_id) REFERENCES public.kitchens(id);
ALTER TABLE public.kitchen_verifications ADD CONSTRAINT kitchen_verifications_verifier_id_fkey FOREIGN KEY (verifier_id) REFERENCES public.profiles(id);
ALTER TABLE public.verification_requests ADD CONSTRAINT verification_requests_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.verification_history ADD CONSTRAINT verification_history_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.verification_requests(id);
ALTER TABLE public.verification_history ADD CONSTRAINT verification_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id);
ALTER TABLE public.delivery_partner_location ADD CONSTRAINT delivery_partner_location_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.delivery_partner_location ADD CONSTRAINT delivery_partner_location_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id);
ALTER TABLE public.delivery_assignments ADD CONSTRAINT delivery_assignments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.delivery_assignments ADD CONSTRAINT delivery_assignments_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
ALTER TABLE public.delivery_tracking ADD CONSTRAINT delivery_tracking_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.delivery_assignments(id);
ALTER TABLE public.delivery_earnings ADD CONSTRAINT delivery_earnings_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.delivery_assignments(id);
ALTER TABLE public.delivery_earnings ADD CONSTRAINT delivery_earnings_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.delivery_partners(id);
