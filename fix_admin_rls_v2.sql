-- ============================================
-- FIX: ADMIN RLS POLICY MISMATCH
-- ============================================

-- The issue: "isAdmin()" checks the 'admins' table, but the RLS policy checked 'profiles.role'.
-- If an admin didn't have role='admin' in their profile, they couldn't update other users.

-- 1. Drop the incorrect policies
DROP POLICY IF EXISTS "Enable read access for admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for admins" ON public.profiles;

-- 2. Create correct policies that check the 'admins' table
CREATE POLICY "Enable read access for admins"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Enable update for admins"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()
  )
);

-- 3. Also fix the 'admins' table RLS so admins can actually query it!
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admins"
ON public.admins FOR SELECT
TO authenticated
USING (
  auth.uid() = id -- An admin can see themselves
);
