-- Fix Admins access to custom projects
-- Because admins use auth_email via Supabase Auth, we must check both username and auth_email

DROP POLICY IF EXISTS "Admins can view all custom projects" ON public.custom_project_submissions;
DROP POLICY IF EXISTS "Admins can delete custom projects" ON public.custom_project_submissions;
DROP POLICY IF EXISTS "Admins can update custom projects" ON public.custom_project_submissions;

-- Authenticated users can read all (for admin dashboard using anon/auth key)
CREATE POLICY "Admins can view all custom projects"
    ON public.custom_project_submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_credentials ac 
            WHERE (ac.username = (select auth.jwt() ->> 'email') OR ac.auth_email = (select auth.jwt() ->> 'email'))
            AND ac.is_active = true
        )
    );

-- Allow admin deletes
CREATE POLICY "Admins can delete custom projects"
    ON public.custom_project_submissions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_credentials ac 
            WHERE (ac.username = (select auth.jwt() ->> 'email') OR ac.auth_email = (select auth.jwt() ->> 'email'))
            AND ac.is_active = true
        )
    );

-- Allow admin updates (for status/notes)
CREATE POLICY "Admins can update custom projects"
    ON public.custom_project_submissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_credentials ac 
            WHERE (ac.username = (select auth.jwt() ->> 'email') OR ac.auth_email = (select auth.jwt() ->> 'email'))
            AND ac.is_active = true
        )
    );

-- Clear schema cache to ensure policies apply immediately
NOTIFY pgrst, 'reload schema';
