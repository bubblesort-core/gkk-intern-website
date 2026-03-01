-- ==============================================================================
-- FIX SIGNUP 422 ERROR (Disable Blocking Triggers)
-- ==============================================================================

-- 1. DROP THE BLOCKING TRIGGER
-- This trigger checks creating users against the applications table and raises exceptions.
-- These exceptions cause Supabase to return 422/500 errors to the client.
-- We want to allow signup (so auth.users is created) and then handle profile creation safely.
DROP TRIGGER IF EXISTS ensure_application_approved ON auth.users;

-- 2. DROP THE FUNCTION
DROP FUNCTION IF EXISTS public.check_application_whitelist();

-- 3. ENSURE PROFILE CREATION TRIGGER IS ACTIVE
-- This trigger creates the public.profile entries
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
