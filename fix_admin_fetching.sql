-- ============================================
-- FIX: ALLOW ADMINS TO VIEW ALL PROFILES
-- ============================================

-- 1. Enable RLS on profiles (User might have already done this, but good to be safe)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Admins
-- This policy allows anyone who passes the is_admin_user() check to SELECT from profiles.
-- This is necessary for the Admin Dashboard to fetch user emails and link them to applications.

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_admin_user()
);

-- Note: This relies on the function public.is_admin_user() existing.
-- If you haven't run 'fix_trigger_error.sql' yet, run that first!

SELECT 'Admin RLS Policy Applied' as status;
