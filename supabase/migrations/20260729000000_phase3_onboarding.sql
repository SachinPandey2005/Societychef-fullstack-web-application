-- Phase 3 Onboarding & KYC Schema Migration
-- 1. Extend delivery_partners with personal, address and KYC details
ALTER TABLE public.delivery_partners 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS blood_group text,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'English',
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS permanent_address text,
ADD COLUMN IF NOT EXISTS current_address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS landmark text,
ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED')),
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 2. Partner Documents Table
CREATE TABLE IF NOT EXISTS public.partner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('aadhaar_front', 'aadhaar_back', 'pan_card', 'license_front', 'license_back', 'passport', 'selfie')),
  document_url text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  expiry_date date,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, document_type)
);

-- 3. Vehicles Details Table
CREATE TABLE IF NOT EXISTS public.partner_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('BIKE', 'SCOOTER', 'CYCLE', 'EV', 'WALKING')),
  vehicle_number text NOT NULL,
  rc_url text NOT NULL,
  insurance_url text NOT NULL,
  puc_url text,
  photo_url text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id)
);

-- 4. Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.partner_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  holder_name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  upi_id text,
  cheque_url text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id)
);

-- 5. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.partner_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  primary_name text NOT NULL,
  primary_phone text NOT NULL,
  primary_relationship text NOT NULL,
  secondary_name text,
  secondary_phone text,
  secondary_relationship text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id)
);

-- 6. Society Assignments Table
CREATE TABLE IF NOT EXISTS public.partner_society_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  society_id uuid NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  tower_coverage text[] DEFAULT '{}',
  delivery_radius_km numeric DEFAULT 2.0,
  working_zone text,
  shift_timing_start text,
  shift_timing_end text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id)
);

-- 7. Verification Audit Logs Table
CREATE TABLE IF NOT EXISTS public.partner_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  action text NOT NULL, -- e.g., 'SUBMITTED', 'APPROVED', 'REJECTED'
  rejection_reason text,
  performed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
