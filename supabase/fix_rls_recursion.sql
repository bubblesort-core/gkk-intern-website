-- ==============================================================================
-- FIX RLS INFINITE RECURSION (AGGRESSIVE CLEAN SLATE)
-- ==============================================================================

-- 1. DROP ALL POLICIES ON PROFILES (DYNAMICALLY)
-- This ensures we catch existing policies even if they have different names.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Helper function to safely check role without triggering RLS recursion
-- SECURITY DEFINER is crucial: it runs as the function creator (admin), bypassing RLS.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  val text;
BEGIN
  -- Simple query, runs as admin so no recursion
  SELECT role INTO val FROM public.profiles WHERE id = auth.uid();
  RETURN val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-Create Safe Policies

-- A. VIEW (SELECT)
CREATE POLICY "View Policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id 
  OR 
  get_my_role() = 'admin' 
  OR 
  get_my_role() = 'super_admin'
);

-- B. UPDATE (UPDATE)
CREATE POLICY "Update Policy" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  get_my_role() = 'admin'
) WITH CHECK (
  auth.uid() = id 
  OR 
  get_my_role() = 'admin'
);

-- C. INSERT (INSERT)
CREATE POLICY "Insert Policy" ON public.profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- 4. Ensure RLS is Enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
