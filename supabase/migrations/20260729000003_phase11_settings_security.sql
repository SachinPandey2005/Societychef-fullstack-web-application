-- Phase 11: Settings, registered devices, compliance documentation, and system log audits

-- 1. Device Logs Table
CREATE TABLE IF NOT EXISTS public.partner_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  os_type text NOT NULL,
  app_version text NOT NULL,
  device_token text,
  last_login_at timestamptz DEFAULT now(),
  last_sync_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Settings configurations
CREATE TABLE IF NOT EXISTS public.partner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid UNIQUE NOT NULL REFERENCES public.delivery_partners(id) ON DELETE CASCADE,
  language text DEFAULT 'en' CHECK (language IN ('en', 'hi', 'kn', 'ta')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled boolean DEFAULT true,
  biometrics_enabled boolean DEFAULT false,
  location_preferences text DEFAULT 'ALWAYS' CHECK (location_preferences IN ('ALWAYS', 'WHILE_USING', 'DISABLED')),
  map_preferences text DEFAULT 'GOOGLE' CHECK (map_preferences IN ('GOOGLE', 'APPLE', 'OSM')),
  updated_at timestamptz DEFAULT now()
);

-- 3. Compliance Documents Table
CREATE TABLE IF NOT EXISTS public.compliance_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text UNIQUE NOT NULL CHECK (document_type IN ('PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'PARTNER_AGREEMENT', 'LICENSES')),
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 4. Audit Log and Monitoring Trace
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  severity text DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  description text NOT NULL,
  api_latency numeric,
  battery_level int,
  gps_status text,
  created_at timestamptz DEFAULT now()
);

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_devices;

-- Seed compliance agreement contents
INSERT INTO public.compliance_docs (document_type, title, content, version) VALUES
('PRIVACY_POLICY', 'Privacy Policy', 'We value your privacy. This policy outlines how Society Chef collects and logs your live GPS location data (for routing and tracking), profile records, and device details during active delivery shifts.', 'v2.1'),
('TERMS_OF_SERVICE', 'Terms of Service', 'By accessing or using the Society Chef Delivery Partner App, you agree to fulfill kitchen pickups and customer deliveries in accordance with standard safety, speed, and packaging guidelines.', 'v1.4'),
('PARTNER_AGREEMENT', 'Delivery Partner Agreement', 'This agreement governs your engagement as an independent logistics contractor with Society Chef. Under this contract, settlements are paid out weekly and performance incentives are calculated daily based on completed deliveries, peak surges, and quality ratings.', 'v3.0'),
('LICENSES', 'Open Source Notices', 'This app makes use of libraries under standard MIT, Apache 2.0, and BSD licenses, including React Native, Expo, Zustand, React Navigation, and Supabase client libraries.', 'v1.0')
ON CONFLICT (document_type) DO UPDATE
SET title = EXCLUDED.title, content = EXCLUDED.content, version = EXCLUDED.version, updated_at = now();
