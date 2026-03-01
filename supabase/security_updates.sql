-- ==============================================================================
-- 1. SECURE SIGNUP FLOW (Database Trigger)
-- ==============================================================================

-- Function to check if the user is in the 'approved' applications list
CREATE OR REPLACE FUNCTION public.check_application_whitelist()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the email exists in applications table with approved status
  IF NOT EXISTS (
    SELECT 1 FROM public.applications
    WHERE email = NEW.email AND status = 'approved'
  ) THEN
    -- If not found or not approved, raise an error to block the signup
    RAISE EXCEPTION 'Access Denied: Your application has not been approved yet. Please wait for approval email.';
  END IF;
  
  -- If approved, allow the insert
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users (runs before a new user is created)
DROP TRIGGER IF EXISTS ensure_application_approved ON auth.users;
CREATE TRIGGER ensure_application_approved
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_application_whitelist();


-- ==============================================================================
-- 2. SECURE LIVE MEETINGS (Row Level Security)
-- ==============================================================================

-- Ensure tables exist (create if missing for robustness)
CREATE TABLE IF NOT EXISTS public.active_meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    room_name TEXT -- For Jitsi legacy, kept for compatibility
);

CREATE TABLE IF NOT EXISTS public.meeting_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES public.active_meetings(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL, /* For display */
    user_id UUID REFERENCES auth.users(id), /* Optional link to auth user */
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.active_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;

-- Helper to check if user is admin (assuming profiles table has 'role')
-- Note: Security Definer ensures we can read the profiles table even if RLS blocks it
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES FOR ACTIVE_MEETINGS

-- Admins: Full Access
CREATE POLICY "Admins can do everything on meetings"
  ON public.active_meetings
  FOR ALL
  USING ( public.is_admin() );

-- Users: Read Only (and only active meetings)
CREATE POLICY "Users can view active meetings"
  ON public.active_meetings
  FOR SELECT
  USING ( is_active = true OR public.is_admin() );


-- POLICIES FOR MEETING_MESSAGES

-- Admins: Full Access
CREATE POLICY "Admins can do everything on messages"
  ON public.meeting_messages
  FOR ALL
  USING ( public.is_admin() );

-- Users: View messages
CREATE POLICY "Users can view messages"
  ON public.meeting_messages
  FOR SELECT
  USING ( true );

-- Users: Insert messages (Authenticated users only)
CREATE POLICY "Users can send messages"
  ON public.meeting_messages
  FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

-- ==============================================================================
-- 3. REALTIME ENABLEMENT
-- ==============================================================================
-- Add tables to publication so clients can subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_messages;
