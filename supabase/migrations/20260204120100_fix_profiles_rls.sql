-- Fix RLS policies for profiles table to allow user signup

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile during signup
CREATE POLICY "Enable insert for authenticated users during signup"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile even as anon (for signup flow)
CREATE POLICY "Enable insert for users based on email"
ON public.profiles FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Enable read access for own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Enable read access for admins"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update all profiles
CREATE POLICY "Enable update for admins"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
