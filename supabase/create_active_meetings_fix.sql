-- ==============================================================================
-- FIX: Create missing active_meetings table and sync with sessions
-- ==============================================================================

-- 1. Create the table if it's missing (as expected by some legacy components)
CREATE TABLE IF NOT EXISTS public.active_meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    video_url TEXT,
    join_url TEXT,
    platform TEXT CHECK (platform IN ('google_meet', 'youtube_live', 'zoom', 'other')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    target_type TEXT DEFAULT 'all', -- 'all', 'team', 'batch', 'intern'
    target_ids JSONB DEFAULT '[]', -- Array of IDs
    scheduled_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE public.active_meetings ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Allow public read-only access to meetings" ON public.active_meetings;
CREATE POLICY "Allow public read-only access to meetings"
ON public.active_meetings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admins full access to meetings" ON public.active_meetings;
CREATE POLICY "Allow admins full access to meetings"
ON public.active_meetings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_meetings;

COMMENT ON TABLE public.active_meetings IS 'Legacy table for live meetings, now largely superseded by sessions but kept for compatibility.';
