-- delivery.repository.ts's online/offline toggle (used by every order's
-- partner-assignment lookup, via getAvailablePartners) assumed
-- delivery_partners.is_online and .updated_at, neither of which exist in the
-- live database — confirmed every call on this path would error with
-- "column does not exist". current_lat/current_lng are NOT added here since
-- the real columns current_latitude/current_longitude already exist and
-- serve the same purpose.

ALTER TABLE public.delivery_partners
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
