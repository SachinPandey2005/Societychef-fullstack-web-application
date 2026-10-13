-- Phase 3 Storage Buckets & Policies Migration
-- Run in Supabase SQL editor or apply via Supabase CLI

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('partner-documents', 'partner-documents', false),
  ('partner-profile', 'partner-profile', true),
  ('delivery-proof', 'delivery-proof', false),
  ('vehicle-documents', 'vehicle-documents', false),
  ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Configure RLS Policies
-- Allow authenticated users to upload to these buckets
DROP POLICY IF EXISTS "Allow authenticated uploads to partner buckets" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to partner buckets" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id IN ('partner-documents', 'partner-profile', 'delivery-proof', 'vehicle-documents', 'kyc-documents')
);

-- Allow owner or ops/admin to view files in private buckets
DROP POLICY IF EXISTS "Allow owner and admin to view partner documents" ON storage.objects;
CREATE POLICY "Allow owner and admin to view partner documents" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
  bucket_id IN ('partner-documents', 'delivery-proof', 'vehicle-documents', 'kyc-documents')
  AND (
    auth.uid() = owner 
    OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')
  )
);

-- Allow public read for partner-profile bucket
DROP POLICY IF EXISTS "Allow public read for partner profiles" ON storage.objects;
CREATE POLICY "Allow public read for partner profiles" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'partner-profile'
);

-- Allow owners to delete their own uploads
DROP POLICY IF EXISTS "Allow owners to delete own uploads" ON storage.objects;
CREATE POLICY "Allow owners to delete own uploads" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id IN ('partner-documents', 'partner-profile', 'delivery-proof', 'vehicle-documents', 'kyc-documents')
  AND auth.uid() = owner
);
