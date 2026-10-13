-- Consumer profile.tsx has always written avatar_url/cover_image to the
-- profiles table (originally via a direct Supabase client call that was
-- silently failing in production since the columns never existed — confirmed
-- against both this local mirror and schema.ts, which was introspected from
-- the live DB in Phase 1). Adding them for real so the avatar/cover upload
-- flow being rewired onto the backend (PATCH /auth/profile) in Phase 3.5
-- actually persists.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image text;
