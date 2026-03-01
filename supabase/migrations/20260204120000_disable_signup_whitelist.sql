-- Disable the problematic signup whitelist trigger that's blocking new user signups
DROP TRIGGER IF EXISTS ensure_application_approved ON auth.users;

-- Optional: Also remove the function if not needed elsewhere
-- DROP FUNCTION IF EXISTS public.check_application_whitelist();

-- This allows users to sign up freely without needing pre-approval
-- You can manually approve them later in the admin panel
