-- ==============================================================================
-- STRICT SIGNUP RESTRICTION (Approved Users Only)
-- ==============================================================================

-- 1. Create the Validation Function
CREATE OR REPLACE FUNCTION public.check_application_whitelist()
RETURNS TRIGGER AS $$
DECLARE
  app_status text;
BEGIN
  -- Fetch status for this email from applications table
  SELECT status INTO app_status
  FROM public.applications
  WHERE email = NEW.email
  ORDER BY created_at DESC
  LIMIT 1;

  -- 1. Check if email exists at all
  IF app_status IS NULL THEN
     RAISE EXCEPTION 'Access Denied: No application found. Please apply at our career page first.';
  END IF;

  -- 2. Check specific statuses
  IF app_status = 'approved' THEN
     -- ALLOW: This is the only case we allow
     RETURN NEW;
  
  ELSIF app_status = 'shortlisted' THEN
     RAISE EXCEPTION 'Access Denied: Your application is Shortlisted. Please wait for the final interview call letter.';

  ELSIF app_status = 'ready_interview' THEN
     RAISE EXCEPTION 'Access Denied: You are Ready for Interview. Please check your email for the schedule.';

  ELSIF app_status = 'rejected' THEN
     RAISE EXCEPTION 'Access Denied: Unfortunately, your application was not selected at this time.';
  
  ELSE
     -- Handle 'pending', 'reviewing', or any unknown status
     RAISE EXCEPTION 'Access Denied: Application status is %. Please wait for approval.', app_status;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach the Trigger to auth.users
DROP TRIGGER IF EXISTS ensure_application_approved ON auth.users;

CREATE TRIGGER ensure_application_approved
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_application_whitelist();

-- 3. Double check: Ensure no other triggers differ
-- (optional cleanup of old triggers if names differed)
