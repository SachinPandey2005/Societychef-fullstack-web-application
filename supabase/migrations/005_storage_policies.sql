-- Migration: 005_storage_policies.sql
-- Sets up Supabase Storage buckets for media management and enforces RLS policies

-- 1. Create Buckets
insert into storage.buckets (id, name, public) 
values 
  ('kitchen-media', 'kitchen-media', true),
  ('chef-photos', 'chef-photos', true),
  ('chef-documents', 'chef-documents', false)
on conflict (id) do nothing;

-- 2. Configure RLS Policies for kitchen-media & chef-photos (Public Read via CDN, Authenticated/Anon List/Write)
drop policy if exists "Public Access to Kitchen Media" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Access to Chef Photos" on storage.objects;

-- Allow public read access to kitchen media and photos
create policy "Public Access to Chef Photos and Media" 
on storage.objects for select 
using (
  bucket_id in ('kitchen-media', 'chef-photos')
);

-- Allow authenticated and anon users to upload kitchen media & photos
create policy "Public Users can upload Kitchen Media" 
on storage.objects for insert 
with check (
  bucket_id in ('kitchen-media', 'chef-photos')
);

-- Allow users to update/delete their own uploads
create policy "Users can update their own Kitchen Media" 
on storage.objects for update 
using (
  bucket_id in ('kitchen-media', 'chef-photos') 
  and auth.uid() = owner
);

create policy "Users can delete their own Kitchen Media" 
on storage.objects for delete 
using (
  bucket_id in ('kitchen-media', 'chef-photos') 
  and auth.uid() = owner
);

-- 3. Configure RLS Policies for chef-documents (Private)
-- Only allow the owner or ops/admin roles to view these documents
create policy "Owner and Admin can view Chef Documents" 
on storage.objects for select 
using (
  bucket_id = 'chef-documents' 
  and (
    auth.uid() = owner 
    or auth.jwt()->>'role' = 'ops'
    or auth.jwt()->>'role' = 'admin'
  )
);

create policy "Owner can upload Chef Documents" 
on storage.objects for insert 
with check (
  bucket_id = 'chef-documents' 
  and auth.role() = 'authenticated'
);

create policy "Owner can delete own Chef Documents" 
on storage.objects for delete 
using (
  bucket_id = 'chef-documents' 
  and auth.uid() = owner
);
