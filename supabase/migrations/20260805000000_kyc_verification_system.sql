-- 1. Create kitchen verifications queue
CREATE TABLE IF NOT EXISTS public.kitchen_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id uuid NOT NULL REFERENCES public.kitchens(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REQUEST_RESUBMISSION', 'SUSPENDED')),
  documents_url text[],
  hygiene_records_url text[],
  verifier_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verification_notes text,
  verification_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS & add policies
ALTER TABLE public.kitchen_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ops manage kitchen verifications" ON public.kitchen_verifications;
CREATE POLICY "Ops manage kitchen verifications" ON public.kitchen_verifications
  FOR ALL TO authenticated USING (auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

DROP POLICY IF EXISTS "Chefs view own kitchen verifications" ON public.kitchen_verifications;
CREATE POLICY "Chefs view own kitchen verifications" ON public.kitchen_verifications
  FOR SELECT TO authenticated USING (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()));

-- 2. Create partner verification requests queue
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_pending_request UNIQUE (partner_id, status)
);

-- Enable RLS & add policies
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ops manage partner verifications" ON public.verification_requests;
CREATE POLICY "Ops manage partner verifications" ON public.verification_requests
  FOR ALL TO authenticated USING (auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

DROP POLICY IF EXISTS "Partners view own verifications" ON public.verification_requests;
CREATE POLICY "Partners view own verifications" ON public.verification_requests
  FOR SELECT TO authenticated USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

-- 3. Create verification history logger
CREATE TABLE IF NOT EXISTS public.verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  performed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS & add policies
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ops view verification history" ON public.verification_history;
CREATE POLICY "Ops view verification history" ON public.verification_history
  FOR SELECT TO authenticated USING (auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

DROP POLICY IF EXISTS "Partners view own verification history" ON public.verification_history;
CREATE POLICY "Partners view own verification history" ON public.verification_history
  FOR SELECT TO authenticated USING (request_id IN (SELECT id FROM public.verification_requests WHERE partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid())));

-- 4. Sync historical data: Insert any existing 'UNDER_REVIEW' partners into the queue
INSERT INTO public.verification_requests (partner_id, status, created_at, updated_at)
SELECT id, 'PENDING', now(), now()
FROM public.delivery_partners
WHERE kyc_status = 'UNDER_REVIEW'
ON CONFLICT (partner_id, status) DO NOTHING;

-- 5. Insert history entry for synced partners
INSERT INTO public.verification_history (request_id, status, notes)
SELECT id, 'PENDING', 'KYC documents submitted for review (synced from profile status)'
FROM public.verification_requests
WHERE status = 'PENDING'
ON CONFLICT DO NOTHING;
