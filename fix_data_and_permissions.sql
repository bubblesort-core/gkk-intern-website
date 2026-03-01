-- ============================================
-- MASTER FIX SCRIPT: DATA & PERMISSIONS (FIXED)
-- ============================================

-- 1. FIX DATA CORRUPTION (Wrong Emails)
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id
  AND public.profiles.email != auth.users.email;

-- 2. BACKFILL NAMES (Fix "noreplay" slugs)
-- If profile name is missing but they have an approved application, copy the name.
UPDATE public.profiles
SET 
  full_name = applications.full_name,
  phone = applications.phone,
  skills = applications.skills,
  college = applications.college,
  linkedin_url = applications.linkedin_url,
  github_url = applications.github_url,
  portfolio_url = applications.portfolio_url
FROM applications
WHERE profiles.email = applications.email
  AND (profiles.full_name IS NULL OR profiles.full_name = '')
  AND applications.status = 'approved';

-- 3. FIX PERMISSIONS (Allow Admin to Update Users)
-- We need to ensure the RLS policy checks the 'admin_credentials' table (not 'admins')
DROP POLICY IF EXISTS "Enable read access for admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON public.profiles;

-- Ensure admin_credentials has RLS enabled (optional but good practice)
-- If admin_credentials isn't RLS enabled, anyone might be able to read it if not careful.
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for admins"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_credentials WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable update for admins"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_credentials WHERE id = auth.uid()
  )
);

-- Allow admins to read their own credentials table
DROP POLICY IF EXISTS "Admins can view own credentials" ON public.admin_credentials;
CREATE POLICY "Admins can view own credentials"
ON public.admin_credentials FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);
