-- ==============================================================================
-- ROBUST SIGNUP RESTRICTION (Fixing Case Sensitivity & Status Logic)
-- ==============================================================================

-- 1. Create the Validation Function (Case Insensitive)
CREATE OR REPLACE FUNCTION public.check_application_whitelist()
RETURNS TRIGGER AS $$
DECLARE
  app_status text;
  normalized_email text;
BEGIN
  -- Normalize email to lowercase
  normalized_email := LOWER(NEW.email);

  -- Fetch status for this email from applications table
  SELECT status INTO app_status
  FROM public.applications
  WHERE LOWER(email) = normalized_email
  ORDER BY created_at DESC
  LIMIT 1;

  -- 1. Check if email exists at all
  IF app_status IS NULL THEN
     RAISE EXCEPTION 'Access Denied: No application found. Please apply at our career page first.';
  END IF;

  -- 2. Check specific statuses (case-insensitive)
  IF LOWER(app_status) = 'approved' OR LOWER(app_status) LIKE '%approved%' THEN
     -- ALLOW
     RETURN NEW;

  ELSIF LOWER(app_status) = 'shortlisted' THEN
     RAISE EXCEPTION 'Access Denied: Your application is Shortlisted. Please wait for the final interview call letter.';

  ELSIF LOWER(app_status) = 'ready_interview' THEN
     RAISE EXCEPTION 'Access Denied: You are Ready for Interview. Please check your email for the schedule.';

  ELSIF LOWER(app_status) = 'rejected' THEN
     RAISE EXCEPTION 'Access Denied: Unfortunately, your application was not selected at this time.';
  
  ELSE
     -- Handle 'pending', 'reviewing', or any unknown status
     RAISE EXCEPTION 'Access Denied: Application status is %. Please wait for approval.', app_status;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach the Trigger to auth.users (BEFORE INSERT ONLY for Signup)
-- Blocking INSERT blocks the Creation, preventing the Email.
DROP TRIGGER IF EXISTS ensure_application_approved ON auth.users;

CREATE TRIGGER ensure_application_approved
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_application_whitelist();

-- 3. Also Block Sign Ins for Unapproved Users? 
-- (Optional: Block UPDATE to prevent sneaking in? Usually not needed for SignUp block)
-- If we want to block LOGIN for existing unapproved users, we can add a check on auth.sessions via a separate hook, 
-- but blocking INSERT is sufficient for "Restricting Account Creation".

-- 4. Verify existing data?
-- You might want to delete unapproved users who sneaked in:
-- DELETE FROM auth.users WHERE email NOT IN (SELECT email FROM public.applications WHERE status = 'approved');
