-- ============================================
-- FIX: RPC TO FETCH FULL PROFILE DETAILS (Bypasses RLS)
-- ============================================

-- This function will run with "SECURITY DEFINER" privileges, meaning it runs
-- as the database owner, bypassing RLS checks that might block the admin.

-- DROP first to allow changing return type signature safely
DROP FUNCTION IF EXISTS public.get_all_profile_emails();

CREATE OR REPLACE FUNCTION public.get_all_profile_emails()
RETURNS TABLE (id uuid, email text, status text, full_name text, avatar_url text) 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT profiles.id, profiles.email, profiles.status, profiles.full_name, profiles.avatar_url FROM profiles;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_all_profile_emails() TO anon, authenticated, service_role;

SELECT 'RPC Function Updated (id, email, status, name, avatar)' as status;
