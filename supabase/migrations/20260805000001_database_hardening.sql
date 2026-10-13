-- Phase 1: Database Hardening Pass
-- Run in Supabase SQL editor or apply via Supabase CLI

-- =========================================================================
-- 1. Create New Tables (Phase 1b)
-- =========================================================================

-- 1.1 Create delivery_partner_location table
CREATE TABLE IF NOT EXISTS public.delivery_partner_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  heading numeric,
  speed numeric,
  battery_level integer,
  gps_provider text,
  captured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 Create consolidated audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL,
  module text NOT NULL,
  entity_type text,
  entity_id uuid,
  previous_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- 2. Foreign Key constraints & Integrity (Phase 1c)
-- =========================================================================

DO $$
BEGIN
  -- Add profile reference constraint to wallets if not already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_wallets_profiles'
  ) THEN
    ALTER TABLE public.wallets 
    ADD CONSTRAINT fk_wallets_profiles 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Add partner reference constraint to orders if not already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_orders_delivery_partner'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT fk_orders_delivery_partner 
    FOREIGN KEY (delivery_partner_id) REFERENCES public.delivery_partners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================================
-- 3. Indexes & Constraints Setup (Phase 1d)
-- =========================================================================

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_delivery_partner_location_partner_id_captured_at 
ON public.delivery_partner_location(partner_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_partner_location_coords 
ON public.delivery_partner_location(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id 
ON public.audit_logs(actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_status 
ON public.delivery_partners(status);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_kyc_status 
ON public.delivery_partners(kyc_status);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status 
ON public.verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id 
ON public.wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at 
ON public.wallet_transactions(created_at DESC);

-- Unique/check constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_documents_partner_type 
ON public.partner_documents(partner_id, document_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_role 
ON public.wallets(user_id, role) WHERE status = 'ACTIVE';

DO $$
BEGIN
  -- Safe add format check constraints
  ALTER TABLE public.partner_vehicles DROP CONSTRAINT IF EXISTS chk_vehicle_number;
  ALTER TABLE public.partner_vehicles ADD CONSTRAINT chk_vehicle_number 
  CHECK (vehicle_number IS NULL OR vehicle_number = '' OR vehicle_number ~* '^[a-z0-9\s\-]+$');

  ALTER TABLE public.partner_bank_accounts DROP CONSTRAINT IF EXISTS chk_ifsc_code;
  ALTER TABLE public.partner_bank_accounts ADD CONSTRAINT chk_ifsc_code 
  CHECK (ifsc_code IS NULL OR ifsc_code = '' OR ifsc_code ~* '^[A-Z]{4}0[A-Z0-9]{6}$');
END $$;

-- =========================================================================
-- 4. Triggers (Phase 1d)
-- =========================================================================

-- 4.1 updated_at auto-updating function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to delivery_partner_location
DROP TRIGGER IF EXISTS trg_update_delivery_partner_location_updated_at ON public.delivery_partner_location;
CREATE TRIGGER trg_update_delivery_partner_location_updated_at
BEFORE UPDATE ON public.delivery_partner_location
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4.2 Wallet balance auto-updater
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IN ('CREDIT', 'BONUS', 'REFUND') THEN
    UPDATE public.wallets 
    SET balance = balance + NEW.amount, updated_at = now()
    WHERE id = NEW.wallet_id;
  ELSIF NEW.type IN ('DEBIT', 'PENALTY', 'SETTLEMENT') THEN
    UPDATE public.wallets 
    SET balance = balance - NEW.amount, updated_at = now()
    WHERE id = NEW.wallet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_wallet_balance ON public.wallet_transactions;
CREATE TRIGGER trg_update_wallet_balance
AFTER INSERT ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance();

-- 4.3 Verification log history logger
CREATE OR REPLACE FUNCTION public.log_verification_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.verification_history (request_id, status, notes, created_at)
    VALUES (NEW.id, NEW.status, COALESCE(NEW.notes, 'Verification status update'), now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_verification_change ON public.verification_requests;
CREATE TRIGGER trg_log_verification_change
AFTER INSERT OR UPDATE ON public.verification_requests
FOR EACH ROW EXECUTE FUNCTION public.log_verification_change();

-- =========================================================================
-- 5. Views & SQL Functions (Phase 1j)
-- =========================================================================

-- Views
CREATE OR REPLACE VIEW public.delivery_partner_dashboard_view AS
SELECT 
  status,
  kyc_status,
  COUNT(*) as partner_count
FROM public.delivery_partners
GROUP BY status, kyc_status;

CREATE OR REPLACE VIEW public.delivery_partner_wallet_summary AS
SELECT 
  w.id AS wallet_id,
  w.user_id,
  p.name AS partner_name,
  w.balance,
  w.status
FROM public.wallets w
JOIN public.profiles p ON w.user_id = p.id
WHERE w.role = 'DELIVERY_PARTNER';

CREATE OR REPLACE VIEW public.pending_delivery_verifications AS
SELECT 
  vr.id AS request_id,
  vr.partner_id,
  p.name AS partner_name,
  vr.status,
  vr.created_at
FROM public.verification_requests vr
JOIN public.delivery_partners dp ON vr.partner_id = dp.id
JOIN public.profiles p ON dp.user_id = p.id
WHERE vr.status = 'PENDING';

-- Wallet balance calculation
CREATE OR REPLACE FUNCTION public.calculate_wallet_balance(wallet_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_credits numeric := 0;
  total_debits numeric := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_credits
  FROM public.wallet_transactions
  WHERE wallet_id = wallet_uuid AND type IN ('CREDIT', 'BONUS', 'REFUND');

  SELECT COALESCE(SUM(amount), 0) INTO total_debits
  FROM public.wallet_transactions
  WHERE wallet_id = wallet_uuid AND type IN ('DEBIT', 'PENALTY', 'SETTLEMENT');

  RETURN total_credits - total_debits;
END;
$$ LANGUAGE plpgsql;

-- GPS Nearest search
CREATE OR REPLACE FUNCTION public.find_nearest_delivery_partner(
  target_lat numeric, 
  target_lng numeric, 
  max_distance_km numeric DEFAULT 5.0
)
RETURNS TABLE (
  partner_id uuid,
  distance_km numeric,
  vehicle_type text,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id AS partner_id,
    (6371 * acos(
      cos(radians(target_lat)) * cos(radians(current_latitude)) * 
      cos(radians(current_longitude) - radians(target_lng)) + 
      sin(radians(target_lat)) * sin(radians(current_latitude))
    ))::numeric AS distance_km,
    dp.vehicle_type,
    dp.status
  FROM public.delivery_partners dp
  WHERE dp.status = 'AVAILABLE' AND dp.current_latitude IS NOT NULL AND dp.current_longitude IS NOT NULL
  AND (6371 * acos(
    cos(radians(target_lat)) * cos(radians(current_latitude)) * 
    cos(radians(current_longitude) - radians(target_lng)) + 
    sin(radians(target_lat)) * sin(radians(current_latitude))
  )) <= max_distance_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Order auto-assigner
CREATE OR REPLACE FUNCTION public.auto_assign_nearest_available_partner(order_uuid uuid)
RETURNS uuid AS $$
DECLARE
  k_lat numeric;
  k_lng numeric;
  nearest_partner_id uuid;
BEGIN
  SELECT k.latitude, k.longitude INTO k_lat, k_lng
  FROM public.orders o
  JOIN public.kitchens k ON o.kitchen_id = k.id
  WHERE o.id = order_uuid;

  IF k_lat IS NULL OR k_lng IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT partner_id INTO nearest_partner_id
  FROM public.find_nearest_delivery_partner(k_lat, k_lng, 10.0)
  LIMIT 1;

  IF nearest_partner_id IS NOT NULL THEN
    UPDATE public.orders
    SET delivery_partner_id = nearest_partner_id, status = 'ASSIGNED', updated_at = now()
    WHERE id = order_uuid;

    UPDATE public.delivery_partners
    SET status = 'BUSY'
    WHERE id = nearest_partner_id;
  END IF;

  RETURN nearest_partner_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 6. Row Level Security Policies (Phase 1f)
-- =========================================================================

-- Enable RLS
ALTER TABLE public.delivery_partner_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Location Policies
DROP POLICY IF EXISTS "Admins view all locations" ON public.delivery_partner_location;
CREATE POLICY "Admins view all locations" ON public.delivery_partner_location
  FOR SELECT TO authenticated USING (auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

DROP POLICY IF EXISTS "Partners manage own location" ON public.delivery_partner_location;
CREATE POLICY "Partners manage own location" ON public.delivery_partner_location
  FOR ALL TO authenticated USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

-- Audit Log Policies
DROP POLICY IF EXISTS "Admins view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins view all audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

DROP POLICY IF EXISTS "Service insert audit logs" ON public.audit_logs;
CREATE POLICY "Service insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- =========================================================================
-- 7. Supabase Realtime wiring (Phase 1e)
-- =========================================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'delivery_partners', 'verification_requests', 'verification_history', 
    'delivery_partner_location', 'wallets', 'wallet_transactions', 
    'settlements', 'notifications', 'partner_bank_accounts', 
    'partner_vehicles', 'partner_society_assignments', 'partner_emergency_contacts',
    'orders'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.' || t;
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.' || t;
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
  END LOOP;
END $$;
