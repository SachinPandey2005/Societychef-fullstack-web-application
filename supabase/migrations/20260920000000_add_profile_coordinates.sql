-- Migration: 20260920000000_add_profile_coordinates.sql
-- Description: Add nullable latitude/longitude to profiles so the consumer
-- delivery-address flow (mobile app "Add Delivery Address" screen) can store
-- the exact pin dropped via the map picker, alongside the existing free-text
-- society/tower/flat fields. Mirrors the latitude/longitude columns already
-- present on public.addresses and public.societies.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
