-- 0. Define Helper Function is_admin_user()
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_credentials ac
    WHERE (ac.auth_email = auth.jwt()->>'email' OR ac.username = auth.jwt()->>'email')
      AND ac.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on batches if not already enabled
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can create batches" ON public.batches;

-- Create policy to allow admins to insert into batches
CREATE POLICY "Admins can create batches"
ON public.batches
FOR INSERT
WITH CHECK (
  is_admin_user()
);

-- Also allow admins to update/delete batches just in case
DROP POLICY IF EXISTS "Admins can update batches" ON public.batches;
CREATE POLICY "Admins can update batches"
ON public.batches
FOR UPDATE
USING (
  is_admin_user()
);

DROP POLICY IF EXISTS "Admins can delete batches" ON public.batches;
CREATE POLICY "Admins can delete batches"
ON public.batches
FOR DELETE
USING (
  is_admin_user()
);

-- Ensure admins can view batches (SELECT) - usually public but good to explicit
DROP POLICY IF EXISTS "Admins can select batches" ON public.batches;
CREATE POLICY "Admins can select batches"
ON public.batches
FOR SELECT
USING (true); -- Public read for now, or restrict to admin using is_admin_user() if preferred

