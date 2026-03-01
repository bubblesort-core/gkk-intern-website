-- ============================================
-- SECURITY: PREVENT PAYMENT BYPASS
-- ============================================

-- 1. FIX is_admin_user() to match the actual login system
-- The previous version checked 'admins' table, but our login uses 'admin_credentials'.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_credentials WHERE id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  ); -- Kept 'admins' just in case, but added 'admin_credentials'
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. CREATE EXTENSION IF NOT EXISTS (for more robust checks if needed, usually standard)


-- 3. TRIGGER TO PREVENT USERS FROM MARKING THEMSELVES AS ACTIVE
-- This ensures that even if a user manipulates the JS console to send an update,
-- the database will reject the change to the 'status' column.

CREATE OR REPLACE FUNCTION public.prevent_status_hacking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status is being changed
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- If the new status is 'active' or 'approved'
    -- And the user is NOT an admin
    -- And the user is updating their OWN profile (auth.uid = id)
    IF (auth.uid() = OLD.id) AND (NOT public.is_admin_user()) THEN
        
        -- Allow if it's a Service Role (e.g. Payment Webhook)
        -- reliable way to check for service_role in supabase
        IF (current_setting('request.jwt.claim.role', true) = 'service_role') THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Security Violation: You are not authorized to update your payment status directly.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Trigger
DROP TRIGGER IF EXISTS check_status_update_guard ON public.profiles;

CREATE TRIGGER check_status_update_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_status_hacking();

-- 4. DOUBLE CHECK RLS ON PROFILES
-- Ensure Users can only update specific columns
-- (This is hard to enforce purely with "create policy" if we want to allow bio updates but not status, 
--  so the trigger above is the best defense).

SELECT 'Payment Security Enforced' as status;
