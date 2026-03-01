-- ============================================================================
-- CUSTOM PROJECT SUBMISSIONS TABLE
-- Allows interns to submit their own personal/mentor-assigned projects
-- ============================================================================

BEGIN;

-- 1. Create Table
CREATE TABLE IF NOT EXISTS public.custom_project_submissions (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    intern_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       text NOT NULL,
    description text NOT NULL,
    deployed_url text NOT NULL,
    github_url  text,
    status      text NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
    admin_notes text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_custom_projects_intern ON public.custom_project_submissions(intern_id);
CREATE INDEX IF NOT EXISTS idx_custom_projects_created ON public.custom_project_submissions(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.custom_project_submissions ENABLE ROW LEVEL SECURITY;

-- Interns can read their own submissions
CREATE POLICY "Interns can view own custom projects"
    ON public.custom_project_submissions FOR SELECT
    USING (auth.uid() = intern_id);

-- Interns can insert their own submissions
CREATE POLICY "Interns can submit custom projects"
    ON public.custom_project_submissions FOR INSERT
    WITH CHECK (auth.uid() = intern_id);

-- Admins (service role) have full access — handled by service_role key bypassing RLS

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

-- 4. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_custom_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_custom_projects_updated_at
    BEFORE UPDATE ON public.custom_project_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_custom_projects_updated_at();

COMMIT;
