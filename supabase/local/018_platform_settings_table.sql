-- platform_settings never existed (confirmed absent from the live schema
-- dump), despite being live-routed in several places. getAllSettings had a
-- silent fallback to 5 hardcoded fake settings whenever the real query
-- failed or returned empty — meaning admins could never have actually
-- changed a setting (updateSetting has no such fallback, so it always threw)
-- while the settings screen always showed the same fake defaults regardless.
-- Seeded here with those same five defaults so they become real, persisted,
-- editable rows instead of a permanent fake fallback.

CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('FINANCE', 'SYSTEM', 'OPERATIONS', 'MARKETING')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT
);

INSERT INTO public.platform_settings (key, value, description, category, updated_by) VALUES
  ('PLATFORM_COMMISSION_TIERS', '{"standard_percentage": 10, "premium_percentage": 8, "party_catering_percentage": 12}', 'Tiered platform commission percentages applied to chef payouts', 'FINANCE', 'system'),
  ('PAYMENT_GATEWAY_CONFIG', '{"provider": "RAZORPAY", "auto_capture": true, "settlement_cycle": "WEEKLY", "currency": "INR"}', 'Payment gateway integration parameters and payout release cycles', 'SYSTEM', 'system'),
  ('DELIVERY_FLEET_RADIUS_KM', '7.5', 'Maximum delivery partner search radius in kilometers for society clusters', 'OPERATIONS', 'system'),
  ('SURGE_PRICING_MULTIPLIER', '1.2', 'Peak period delivery fee multiplier for inclement weather or high demand', 'OPERATIONS', 'system'),
  ('CHEF_PAYOUT_MINIMUM_THRESHOLD', '500', 'Minimum balance in INR required before automated batch payout execution', 'FINANCE', 'system')
ON CONFLICT (key) DO NOTHING;
