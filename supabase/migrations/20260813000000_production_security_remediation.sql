-- ==============================================================================
-- Migration: 20260813000000_production_security_remediation.sql
-- Description: Fixes critical public write RLS policies, secures private storage buckets, and adds security_invoker to public views.
-- Project: Society Chef
-- ==============================================================================

-- 1. FIX CATALOG & KITCHENS RLS REGRESSIONS (CRITICAL)
DROP POLICY IF EXISTS "Allow all writes dishes" ON public.dishes;
DROP POLICY IF EXISTS "Allow all writes weekly_dishes" ON public.weekly_dishes;
DROP POLICY IF EXISTS "Allow all writes kitchens" ON public.kitchens;

-- Restore Chef/Ops-only write policies
CREATE POLICY "Chefs manage own kitchen dishes" ON public.dishes
  FOR ALL TO authenticated
  USING (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN'))
  WITH CHECK (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Chefs manage own weekly schedule" ON public.weekly_dishes
  FOR ALL TO authenticated
  USING (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN'))
  WITH CHECK (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Chefs manage own kitchen profile" ON public.kitchens
  FOR ALL TO authenticated
  USING (chef_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN'))
  WITH CHECK (chef_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN'));


-- 2. FIX STORAGE BUCKET PUBLIC ACCESS VULNERABILITY (CRITICAL)
DROP POLICY IF EXISTS "Public development access to partner buckets" ON storage.objects;

-- Re-establish secure owner/ops access for private buckets
CREATE POLICY "Allow authenticated uploads to partner buckets" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id IN ('partner-documents', 'partner-profile', 'delivery-proof', 'vehicle-documents', 'kyc-documents'));

CREATE POLICY "Allow owner and admin to view partner documents" 
ON storage.objects FOR SELECT TO authenticated 
USING (
  bucket_id IN ('partner-documents', 'delivery-proof', 'vehicle-documents', 'kyc-documents')
  AND (owner = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops', 'admin', 'SUPER_ADMIN'))
);

CREATE POLICY "Allow public read for partner profiles" 
ON storage.objects FOR SELECT USING (bucket_id = 'partner-profile');

CREATE POLICY "Allow owners to delete own uploads" 
ON storage.objects FOR DELETE TO authenticated 
USING (
  bucket_id IN ('partner-documents', 'partner-profile', 'delivery-proof', 'vehicle-documents', 'kyc-documents')
  AND owner = auth.uid()
);


-- 3. FIX VIEWS SECURITY INVOKER (HIGH)
CREATE OR REPLACE VIEW public.delivery_partner_dashboard_view 
WITH (security_invoker = true) AS
SELECT status, kyc_status, COUNT(*) as partner_count
FROM public.delivery_partners
GROUP BY status, kyc_status;

CREATE OR REPLACE VIEW public.delivery_partner_wallet_summary 
WITH (security_invoker = true) AS
SELECT w.id AS wallet_id, w.user_id, p.name AS partner_name, w.balance, w.status
FROM public.wallets w
JOIN public.profiles p ON w.user_id = p.id
WHERE w.role = 'DELIVERY_PARTNER';

CREATE OR REPLACE VIEW public.pending_delivery_verifications 
WITH (security_invoker = true) AS
SELECT vr.id AS request_id, vr.partner_id, p.name AS partner_name, vr.status, vr.created_at
FROM public.verification_requests vr
JOIN public.delivery_partners dp ON vr.partner_id = dp.id
JOIN public.profiles p ON dp.user_id = p.id
WHERE vr.status = 'PENDING';


-- 4. ADD PERFORMANCE INDEXES (MEDIUM)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_kitchen_id ON public.orders(kitchen_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON public.orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_partner_documents_partner_id ON public.partner_documents(partner_id);
