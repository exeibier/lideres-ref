-- Migration to create user_profiles for existing users in auth.users
-- This is needed if users were created before the trigger was set up
-- Run this AFTER running migrations 001, 002, and 003

-- Insert profiles for all users in auth.users that don't have a profile yet
INSERT INTO public.user_profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  'customer' -- Default role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify the insert worked
-- You can check by running: SELECT * FROM user_profiles;

