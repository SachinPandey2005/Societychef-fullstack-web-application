-- ==============================================================================
-- Migration: Production Storage Bucket Security & RLS Policy Enforcement
-- Project: Society Chef / RasoHi Platform
-- ==============================================================================

-- 1. Drop temporary development overrides
DROP POLICY IF EXISTS "Public development access to partner buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to partner buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to partner buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner and admin to view partner documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read for partner profiles" ON storage.objects;
DROP POLICY IF EXISTS "Allow owners to delete own uploads" ON storage.objects;

-- 2. Partner Profile Pictures: Public Read, Owner Upload/Delete
CREATE POLICY "Public read partner profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partner-profile');

CREATE POLICY "Owner upload partner profile"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'partner-profile' AND auth.uid() = owner);

-- 3. Delivery Proof: Delivery Partner & Ops Access
CREATE POLICY "Delivery partner upload proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-proof' AND auth.role() = 'authenticated');

CREATE POLICY "Authorized view delivery proof"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'delivery-proof' AND (auth.uid() = owner OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN')));

-- 4. Partner Documents & KYC: Restricted to Owner & Admin/Ops
CREATE POLICY "Owner and Admin view partner documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('partner-documents', 'vehicle-documents', 'kyc-documents') AND 
  (auth.uid() = owner OR auth.jwt()->>'role' IN ('ops', 'admin', 'SUPER_ADMIN'))
);

CREATE POLICY "Owner upload partner documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('partner-documents', 'vehicle-documents', 'kyc-documents') AND 
  auth.uid() = owner
);

CREATE POLICY "Owner delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('partner-documents', 'partner-profile', 'delivery-proof', 'vehicle-documents', 'kyc-documents') AND 
  auth.uid() = owner
);
