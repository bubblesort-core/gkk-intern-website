-- ==============================================================================
-- SECURITY FIX: Payment Status Enforcement via RLS
-- ==============================================================================
-- This migration adds server-side enforcement of payment status
-- Ensures only 'active' (paid) users can access premium features

-- 1. Helper function to check if current user has paid (status = 'active')
CREATE OR REPLACE FUNCTION public.is_paid_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Helper function to check if current user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  ) OR public.get_my_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- RLS POLICIES FOR TEAMS TABLE
-- ==============================================================================

-- Drop existing policies to recreate safely
DROP POLICY IF EXISTS "Teams visible to paid users" ON public.teams;
DROP POLICY IF EXISTS "Teams visible to members and admins" ON public.teams;

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy: Only paid users OR admins can view teams
CREATE POLICY "Teams visible to paid users and admins"
  ON public.teams
  FOR SELECT
  USING (
    public.is_admin_user() 
    OR public.is_paid_user()
  );

-- Policy: Only admins can insert/update/delete teams
CREATE POLICY "Admins manage teams"
  ON public.teams
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==============================================================================
-- RLS POLICIES FOR TEAM_MEMBERS TABLE
-- ==============================================================================

DROP POLICY IF EXISTS "Team members visible to paid users" ON public.team_members;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- View: Paid users can see team members
CREATE POLICY "Team members visible to paid users"
  ON public.team_members
  FOR SELECT
  USING (
    public.is_admin_user()
    OR public.is_paid_user()
  );

-- Manage: Admins only
CREATE POLICY "Admins manage team members"
  ON public.team_members
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==============================================================================
-- RLS POLICIES FOR PROJECTS TABLE
-- ==============================================================================

DROP POLICY IF EXISTS "Projects visible to paid users" ON public.projects;
DROP POLICY IF EXISTS "Admins manage projects" ON public.projects;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- View: Only paid users or admins
CREATE POLICY "Projects visible to paid users and admins"
  ON public.projects
  FOR SELECT
  USING (
    public.is_admin_user()
    OR public.is_paid_user()
  );

-- Manage: Admins only
CREATE POLICY "Admins manage projects"
  ON public.projects
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==============================================================================
-- RLS POLICIES FOR PROJECT_SUBMISSIONS TABLE
-- ==============================================================================

DROP POLICY IF EXISTS "Submissions visible to paid users" ON public.project_submissions;
DROP POLICY IF EXISTS "Paid users can submit" ON public.project_submissions;

ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- View: Paid users can see submissions
CREATE POLICY "Submissions visible to paid users"
  ON public.project_submissions
  FOR SELECT
  USING (
    public.is_admin_user()
    OR public.is_paid_user()
  );

-- Insert: Only paid users can submit
CREATE POLICY "Paid users can submit"
  ON public.project_submissions
  FOR INSERT
  WITH CHECK (
    public.is_paid_user()
    AND auth.uid() IS NOT NULL
  );

-- Update own submissions
CREATE POLICY "Users can update own submissions"
  ON public.project_submissions
  FOR UPDATE
  USING (
    public.is_admin_user()
    OR (public.is_paid_user() AND submitted_by = auth.uid())
  );

-- ==============================================================================
-- RLS POLICIES FOR ANNOUNCEMENTS TABLE
-- ==============================================================================

DROP POLICY IF EXISTS "Announcements visible to paid users" ON public.announcements;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- View: Paid users can see announcements
CREATE POLICY "Announcements visible to paid users"
  ON public.announcements
  FOR SELECT
  USING (
    public.is_admin_user()
    OR public.is_paid_user()
  );

-- Manage: Admins only
CREATE POLICY "Admins manage announcements"
  ON public.announcements
  FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==============================================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.team_members TO authenticated;
GRANT SELECT ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.project_submissions TO authenticated;
GRANT SELECT ON public.announcements TO authenticated;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
-- Run these queries to verify policies are in place:
-- SELECT * FROM pg_policies WHERE tablename IN ('teams', 'projects', 'announcements');
