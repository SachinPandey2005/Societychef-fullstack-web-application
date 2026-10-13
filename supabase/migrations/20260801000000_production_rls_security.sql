-- Migration: 20260801000000_production_rls_security.sql
-- Description: Tightens RLS security, fixes BOLA/IDOR vulnerabilities on transaction tables, and enforces RLS on all support & partner schema elements.

-- ==========================================
-- 1. Enable RLS on all remaining tables
-- ==========================================
ALTER TABLE IF EXISTS public.partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_society_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.delivery_partner_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reward_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.learning_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emergency_sos_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faq_kb ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.compliance_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Secure core transaction tables (BOLA/IDOR fixes)
-- ==========================================

-- Orders: Can only be viewed/updated by customer, kitchen owner, delivery partner, or admins
DROP POLICY IF EXISTS "Authenticated select orders" ON public.orders;
DROP POLICY IF EXISTS "Consumers insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated update orders" ON public.orders;

CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid() OR 
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
    delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

CREATE POLICY "Consumers place orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Authorized update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid() OR 
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
    delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  )
  WITH CHECK (
    customer_id = auth.uid() OR 
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
    delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

-- Order Items: Viewable/insertable only if parent order is accessible
DROP POLICY IF EXISTS "Authenticated order items" ON public.order_items;

CREATE POLICY "Access order items via order context" ON public.order_items
  FOR ALL TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE 
        customer_id = auth.uid() OR 
        kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
        delivery_partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
        auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
    )
  );

-- Chat Threads: Viewable/insertable only by participants or admins
DROP POLICY IF EXISTS "Authenticated chat threads" ON public.chat_threads;

CREATE POLICY "Participants view own threads" ON public.chat_threads
  FOR SELECT TO authenticated
  USING (
    consumer_id = auth.uid() OR
    kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

CREATE POLICY "Participants create own threads" ON public.chat_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    consumer_id = auth.uid()
  );

-- Chat Messages: Viewable/insertable only by thread participants
DROP POLICY IF EXISTS "Authenticated chat messages" ON public.chat_messages;

CREATE POLICY "Thread participants view messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM public.chat_threads WHERE
        consumer_id = auth.uid() OR
        kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid())
    ) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

CREATE POLICY "Sender insert own messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Dishes / Weekly Dishes Catalog protection: Public read, Chef write
DROP POLICY IF EXISTS "Authenticated edit dishes" ON public.dishes;
CREATE POLICY "Chefs manage own kitchen dishes" ON public.dishes
  FOR ALL TO authenticated
  USING (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'))
  WITH CHECK (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

DROP POLICY IF EXISTS "Authenticated edit weekly dishes" ON public.weekly_dishes;
CREATE POLICY "Chefs manage own weekly schedule" ON public.weekly_dishes
  FOR ALL TO authenticated
  USING (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'))
  WITH CHECK (kitchen_id IN (SELECT id FROM public.kitchens WHERE chef_user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));


-- ==========================================
-- 3. Partner & KYC document policies (Owner + Ops access)
-- ==========================================

-- Partner Documents
CREATE POLICY "Owner/Ops view partner docs" ON public.partner_documents
  FOR SELECT TO authenticated
  USING (
    partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR
    auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  );

CREATE POLICY "Owner upload partner docs" ON public.partner_documents
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner update partner docs" ON public.partner_documents
  FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

-- Vehicles, Bank Accounts, Emergency Contacts, Society Assignments, Settings & Devices
CREATE POLICY "Owner/Ops view partner vehicle" ON public.partner_vehicles
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner manage partner vehicle" ON public.partner_vehicles
  FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner/Ops view partner bank account" ON public.partner_bank_accounts
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner manage partner bank account" ON public.partner_bank_accounts
  FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner/Ops view emergency contacts" ON public.partner_emergency_contacts
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner manage emergency contacts" ON public.partner_emergency_contacts
  FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner/Ops view society assignment" ON public.partner_society_assignments
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner/Ops view devices" ON public.partner_devices
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner manage devices" ON public.partner_devices
  FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner/Ops view settings" ON public.partner_settings
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner manage settings" ON public.partner_settings
  FOR ALL TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));


-- ==========================================
-- 4. Gamification & metrics policies (Owner SELECT, service_role write)
-- ==========================================
CREATE POLICY "Owner/Ops view metrics" ON public.delivery_partner_metrics
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner/Ops view badges" ON public.partner_badges
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner/Ops view targets" ON public.partner_targets
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner/Ops view incentives" ON public.partner_incentives
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner/Ops view leaderboard" ON public.partner_leaderboard
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner/Ops view rewards" ON public.partner_rewards
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner/Ops view redemptions" ON public.partner_redemptions
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner request redemption" ON public.partner_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner/Ops view penalties" ON public.partner_penalties
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner appeal penalty" ON public.partner_penalties
  FOR UPDATE TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));


-- ==========================================
-- 5. Support & Monitoring logs policies
-- ==========================================
CREATE POLICY "Owner/Ops view tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner open tickets" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Thread messages viewable" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (ticket_id IN (SELECT id FROM public.tickets WHERE profile_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Thread messages insertable" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Owner/Ops view incidents" ON public.partner_incidents
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner log incidents" ON public.partner_incidents
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner/Ops view SOS alarms" ON public.emergency_sos_alarms
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Owner trigger SOS alarm" ON public.emergency_sos_alarms
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner submit feedback" ON public.partner_feedback
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Owner/Ops view feedback" ON public.partner_feedback
  FOR SELECT TO authenticated
  USING (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()) OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));


-- ==========================================
-- 6. Public static configurations
-- ==========================================
CREATE POLICY "Authenticated users view catalogs" ON public.reward_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view learning videos" ON public.learning_videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view FAQ KB" ON public.faq_kb FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users view compliance docs" ON public.compliance_docs FOR SELECT TO authenticated USING (true);


-- ==========================================
-- 7. Internal System Logging
-- ==========================================
CREATE POLICY "Ops view system audit logs" ON public.system_audit_logs
  FOR SELECT TO authenticated
  USING (auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));

CREATE POLICY "Partners write audit logs" ON public.system_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (partner_id IN (SELECT id FROM public.delivery_partners WHERE user_id = auth.uid()));

CREATE POLICY "Ops view partner verification logs" ON public.partner_verification_logs
  FOR SELECT TO authenticated
  USING (auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'));


-- ==========================================
-- 8. Storage bucket policy deprecation fix
-- ==========================================
DROP POLICY IF EXISTS "Authenticated Users can upload Kitchen Media" ON storage.objects;
CREATE POLICY "Authenticated Users can upload Kitchen Media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id in ('kitchen-media', 'chef-photos')
);

DROP POLICY IF EXISTS "Owner can upload Chef Documents" ON storage.objects;
CREATE POLICY "Owner can upload Chef Documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chef-documents'
);
