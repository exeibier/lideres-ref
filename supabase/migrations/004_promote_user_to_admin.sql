-- Migration to promote a user to admin
-- 
-- IMPORTANT: Make sure you have run the following migrations first:
--   1. 001_initial_schema.sql (creates user_profiles table)
--   2. 002_rls_policies.sql (sets up RLS policies)
--   3. 003_bulk_import_schema.sql (additional schema)
--   4. 005_backfill_existing_users.sql (creates profiles for existing users)
--
-- This can be run manually in Supabase SQL Editor to promote a specific user
-- Replace 'user@example.com' with the actual email of the user you want to promote

-- Option 1: Promote by email
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'user@example.com';

-- Option 2: Promote by user ID (if you know the UUID)
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE id = 'user-uuid-here';

-- Option 3: Promote the first user (useful for initial setup)
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM user_profiles ORDER BY created_at ASC LIMIT 1);

