-- Fix RLS Policies for Profiles
-- Problem: Admins cannot view 'public.profiles' to select interns for messaging.
-- Fix: Add a policy allowing admins to SELECT from public.profiles.

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac 
        WHERE ac.username = (select auth.jwt() ->> 'email')
        AND ac.is_active = true
    )
);

-- Force schema reload
NOTIFY pgrst, 'reload config';
