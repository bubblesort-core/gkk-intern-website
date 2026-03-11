-- ============================================
-- MULTI-ADMIN SETUP: ADITYA & PAYEL
-- ============================================

-- 1. Create the dedicated admins table (if not exists)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    admin_role TEXT DEFAULT 'Master Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all admin profiles
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" 
ON public.admins FOR SELECT 
TO authenticated 
USING (public.is_admin_user()); -- Uses Security Definer function to avoid recursion

-- 2. Create optimized admin check function
-- This is used by ALL RLS policies globally
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update existing RLS policies to use the new function
-- Note: You may need to refresh these if they were hardcoded to specific emails

-- Example for Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin_user());

-- Example for Applications
DROP POLICY IF EXISTS "Admin view all applications" ON public.applications;
CREATE POLICY "Admin view all applications"
ON public.applications FOR ALL
TO authenticated
USING (public.is_admin_user());

-- Example for Workshops
DROP POLICY IF EXISTS "Admin has full access to workshops" ON public.workshops;
CREATE POLICY "Admin has full access to workshops" 
ON public.workshops FOR ALL
TO authenticated
USING (public.is_admin_user());

-- Example for Payments
DROP POLICY IF EXISTS "Admin view all payments" ON public.payments;
CREATE POLICY "Admin view all payments" 
ON public.payments FOR ALL
TO authenticated
USING (public.is_admin_user());

-- Example for Batches
DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;
CREATE POLICY "Admins can manage batches" 
ON public.batches FOR ALL
TO authenticated
USING (public.is_admin_user());

-- Example for Teams
DROP POLICY IF EXISTS "Admins manage teams" ON public.teams;
CREATE POLICY "Admins manage teams" 
ON public.teams FOR ALL
TO authenticated
USING (public.is_admin_user());

-- Example for Announcements
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements" 
ON public.announcements FOR ALL
TO authenticated
USING (public.is_admin_user());

-- 4. Instructions for the User:
/*
  STEP 1: Create accounts for Aditya and Payel in Supabase Auth Dashboard (Authentication -> Users -> Add User).
  STEP 2: Once they are created, run the following to "promote" them to Admins:

  INSERT INTO public.admins (id, email, full_name)
  SELECT id, email, 'Aditya CEO 1' FROM auth.users WHERE email = 'aditya04slg@gmail.com'
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.admins (id, email, full_name)
  SELECT id, email, 'Payel CEO 2' FROM auth.users WHERE email = 'deypayel933.com@gmail.com'
  ON CONFLICT (email) DO NOTHING;

  -- Also migrate the existing master admin
  INSERT INTO public.admins (id, email, full_name)
  SELECT id, email, 'Master Admin' FROM auth.users WHERE email = 'noreplay.gkk26@gmail.com'
  ON CONFLICT (email) DO NOTHING;
*/

-- 5. Update admin_credentials table (Required for Legacy Admin Portal)
-- This table is used by Dashboard/public/admin/login.html

-- Ensure the table exists with the expected schema
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT,
    auth_email TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Note: In the steps below, 'id' is fetched from auth.users.
-- User must create the auth account FIRST.

/*
  FINAL PROMOTION SCRIPT (Run after creating Auth users):

  -- 1. Sync to new 'admins' table
  INSERT INTO public.admins (id, email, full_name)
  SELECT id, email, 'Aditya CEO 1' FROM auth.users WHERE email = 'aditya04slg@gmail.com'
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.admins (id, email, full_name)
  SELECT id, email, 'Payel CEO 2' FROM auth.users WHERE email = 'deypayel933.com@gmail.com'
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO public.admins (id, email, full_name)
  SELECT id, email, 'Master Admin' FROM auth.users WHERE email = 'noreplay.gkk26@gmail.com'
  ON CONFLICT (email) DO NOTHING;


  INSERT INTO public.admins (id, email, full_name, admin_role)
  SELECT id, email, 'Anirban COO & VC', 'COO & VC' FROM auth.users WHERE email = 'anirbandas6778788@gmail.com'
  ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, admin_role = EXCLUDED.admin_role;

  -- 2. Sync to legacy 'admin_credentials' table
  INSERT INTO public.admin_credentials (id, username, display_name, auth_email, is_active)
  SELECT id, 'anirban_coo', 'Anirban COO & VC', email, true FROM auth.users WHERE email = 'anirbandas6778788@gmail.com'
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, auth_email = EXCLUDED.auth_email;

  INSERT INTO public.admin_credentials (id, username, display_name, auth_email, is_active)
  SELECT id, 'aditya_ceo1', 'Aditya CEO 1', email, true FROM auth.users WHERE email = 'aditya04slg@gmail.com'
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, auth_email = EXCLUDED.auth_email;

  INSERT INTO public.admin_credentials (id, username, display_name, auth_email, is_active)
  SELECT id, 'payel_ceo2', 'Payel CEO 2', email, true FROM auth.users WHERE email = 'deypayel933.com@gmail.com'
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, auth_email = EXCLUDED.auth_email;

  INSERT INTO public.admin_credentials (id, username, display_name, auth_email, is_active)
  SELECT id, 'admingkk2026', 'Master Admin', email, true FROM auth.users WHERE email = 'noreplay.gkk26@gmail.com'
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, auth_email = EXCLUDED.auth_email;
*/
