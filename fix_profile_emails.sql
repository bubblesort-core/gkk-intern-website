-- ============================================
-- FIX: SYNC PROFILE EMAILS WITH AUTH USERS
-- ============================================

-- This script ensures that the 'email' column in the 'profiles' table
-- matches the actual email in the 'auth.users' table.
-- It fixes cases where a profile might have been created or updated with the wrong email address.

UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id
  AND public.profiles.email != auth.users.email;

-- Output the number of rows fixed (optional, if running in a tool that supports it)
-- SELECT count(*) FROM profiles;
