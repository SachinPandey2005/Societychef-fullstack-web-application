-- Phase 10: Support tickets, incident logging, emergency SOS tracker, and FAQs

-- 1. Extend Tickets Table if not already done
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('DELIVERY_ISSUE', 'PICKUP_ISSUE', 'CUSTOMER_ISSUE', 'CHEF_ISSUE', 'PAYMENT_ISSUE', 'WALLET_ISSUE', 'TECHNICAL_ISSUE', 'ACCOUNT_ISSUE', 'SAFETY_ISSUE', 'EMERGENCY', 'OTHER')),
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Chat messages in support tickets
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  media_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 3. Partner incidents
CREATE TABLE IF NOT EXISTS public.partner_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  incident_type text NOT NULL CHECK (incident_type IN ('ACCIDENT', 'VEHICLE_BREAKDOWN', 'CUSTOMER_MISCONDUCT', 'CHEF_MISCONDUCT', 'FOOD_DAMAGE', 'ROAD_CLOSURE', 'SAFETY_HAZARD', 'MEDICAL_EMERGENCY')),
  description text NOT NULL,
  evidence_url text,
  latitude numeric,
  longitude numeric,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Emergency SOS trigger log
CREATE TABLE IF NOT EXISTS public.emergency_sos_alarms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'FALSE_ALARM')),
  created_at timestamptz DEFAULT now()
);

-- 5. FAQ Table
CREATE TABLE IF NOT EXISTS public.faq_kb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('ORDER_PROCESS', 'PICKUP', 'DELIVERY', 'PAYMENTS', 'WALLET', 'APP_USAGE', 'SAFETY', 'TROUBLESHOOTING')),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. Feedback & Bug Reports
CREATE TABLE IF NOT EXISTS public.partner_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('APP_FEEDBACK', 'BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL_SUGGESTION')),
  description text NOT NULL,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED')),
  created_at timestamptz DEFAULT now()
);

-- Realtime activations
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_sos_alarms;

-- Seed initial FAQ articles
INSERT INTO public.faq_kb (category, question, answer) VALUES
('ORDER_PROCESS', 'How do I accept an order?', 'When an order is assigned to you, it will ring on your Home dashboard screen. Simply slide or tap the Accept button within 30 seconds to confirm the pickup.'),
('PICKUP', 'What should I do if food is not ready at the kitchen?', 'Wait for 5 minutes. If it exceeds 10 minutes, report it via the Support Hub under Pickup Issue. We will contact the Chef or dispatch team to resolve it.'),
('DELIVERY', 'What if the customer is unreachable at gated society entry?', 'Call the customer up to 3 times. If they do not pick up, notify society gate security and file a ticket under Customer Unavailable. Do not mark delivered until approved by Ops.'),
('PAYMENTS', 'When do weekly settlements get credited?', 'All settlements are computed on Monday morning and credited into your linked bank account by Wednesday 6:00 PM.'),
('WALLET', 'How does the daily peak bonus work?', 'Deliveries completed during peak lunch hours (12 PM - 3 PM) and dinner hours (7 PM - 10 PM) in highlighted zones earn extra ₹25 per order.'),
('APP_USAGE', 'My GPS location is not updating properly. How to fix it?', 'Ensure GPS/Location services are set to "Always Allow" in your phone settings. Try toggling Airplane mode or restarting the app if sync state shows disconnected.'),
('SAFETY', 'What is standard emergency SOS procedure?', 'Hold the emergency SOS button on the home dashboard or support screen for 3 seconds. Our Ops control room will immediately track your live GPS coords and coordinate rescue.')
ON CONFLICT DO NOTHING;
