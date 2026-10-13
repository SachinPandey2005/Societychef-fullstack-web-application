-- Migration: 20260805000002_delivery_core_tables.sql
-- Description: Create delivery_assignments, delivery_tracking, and delivery_earnings tables

-- 1. Create delivery_assignments table
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'AT_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'REACHED_CUSTOMER', 'DELIVERED', 'CANCELLED', 'FAILED')),
  pickup_otp text NOT NULL,
  delivery_otp text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz
);

-- 2. Create delivery_tracking table
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.delivery_assignments(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- 3. Create delivery_earnings table
CREATE TABLE IF NOT EXISTS public.delivery_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.delivery_assignments(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
  created_at timestamptz DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_earnings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
DROP POLICY IF EXISTS "Allow authenticated read delivery_assignments" ON public.delivery_assignments;
CREATE POLICY "Allow authenticated read delivery_assignments" ON public.delivery_assignments 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow partners update own assignments" ON public.delivery_assignments;
CREATE POLICY "Allow partners update own assignments" ON public.delivery_assignments 
  FOR UPDATE TO authenticated USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Allow service insert assignments" ON public.delivery_assignments;
CREATE POLICY "Allow service insert assignments" ON public.delivery_assignments 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read tracking" ON public.delivery_tracking;
CREATE POLICY "Allow authenticated read tracking" ON public.delivery_tracking 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service insert tracking" ON public.delivery_tracking;
CREATE POLICY "Allow service insert tracking" ON public.delivery_tracking 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read earnings" ON public.delivery_earnings;
CREATE POLICY "Allow authenticated read earnings" ON public.delivery_earnings 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service insert earnings" ON public.delivery_earnings;
CREATE POLICY "Allow service insert earnings" ON public.delivery_earnings 
  FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Supabase Realtime wiring
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['delivery_assignments', 'delivery_tracking', 'delivery_earnings'];
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
