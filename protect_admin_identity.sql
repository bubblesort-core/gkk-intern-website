-- ============================================
-- SECURITY: PROTECT ADMIN IDENTITY
-- ============================================

-- This trigger prevents the Admin email from ever being added to the 'profiles' table.
-- This ensures that a dashboard glitch or testing error can never overwrite a student profile
-- with Admin credentials.

CREATE OR REPLACE FUNCTION public.prevent_admin_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Check for specific Admin Email (Case Insensitive)
  IF LOWER(NEW.email) = 'noreplay.gkk26@gmail.com' THEN
    RAISE EXCEPTION 'Security Violation: Cannot create a profile for the Master Admin email.';
  END IF;

  -- 2. Check if ID exists in Admin Credentials (Optional extra safety)
  -- This prevents an Admin User ID from having a Student Profile.
  IF EXISTS (SELECT 1 FROM public.admin_credentials WHERE id = NEW.id) THEN
     RAISE EXCEPTION 'Security Violation: Admin accounts cannot have Student Profiles.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow clean re-run
DROP TRIGGER IF EXISTS check_admin_profile_guard ON public.profiles;

-- Apply Trigger
CREATE TRIGGER check_admin_profile_guard
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_profile_creation();

-- Confirmation
-- SELECT 'Admin Protection Enabled' as status;
