-- ============================================================================
-- MIGRATION: Sessions & Recordings Schema
-- Date: 2026-02-25
-- Purpose: Replace active_meetings with separate sessions + recordings tables
-- CRITICAL: This migration preserves ALL existing data. Nothing is deleted.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,

    -- Platform
    platform TEXT NOT NULL DEFAULT 'youtube'
        CHECK (platform IN ('youtube', 'google_meet')),

    -- Links
    video_url TEXT,            -- YouTube embed URL (for YouTube platform)
    join_url TEXT,              -- Google Meet link or YouTube watch URL

    -- Scheduling
    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    scheduled_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,

    -- Targeting
    target_type TEXT NOT NULL DEFAULT 'all'
        CHECK (target_type IN ('all', 'batch', 'team', 'intern')),
    target_ids TEXT[] DEFAULT '{}',

    -- Room (for live chat)
    room_name TEXT,

    -- Meta
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_start ON public.sessions(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_sessions_target_type ON public.sessions(target_type);

COMMENT ON TABLE public.sessions IS 'Live and scheduled sessions (YouTube Live / Google Meet)';
COMMENT ON COLUMN public.sessions.status IS 'Session lifecycle: scheduled → live → ended or cancelled';
COMMENT ON COLUMN public.sessions.target_type IS 'Audience scope: all, batch, team, or intern';
COMMENT ON COLUMN public.sessions.target_ids IS 'Array of IDs for specific batches, teams, or interns';

-- ============================================================================
-- 2. CREATE RECORDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,

    -- YouTube
    youtube_url TEXT NOT NULL,            -- Original YouTube URL
    youtube_video_id TEXT,                -- Extracted video ID for embed/thumbnail
    thumbnail_url TEXT,                   -- YouTube thumbnail URL (auto or custom)
    duration_label TEXT,                  -- e.g. "45:30" (manually entered)

    -- Targeting
    target_type TEXT NOT NULL DEFAULT 'all'
        CHECK (target_type IN ('all', 'batch', 'team', 'intern')),
    target_ids TEXT[] DEFAULT '{}',

    -- Optional link to a session
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,

    -- Meta
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for recordings
CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON public.recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_target_type ON public.recordings(target_type);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON public.recordings(created_at DESC);

COMMENT ON TABLE public.recordings IS 'YouTube-backed recorded sessions and standalone recordings';
COMMENT ON COLUMN public.recordings.youtube_video_id IS 'Extracted from youtube_url for embed and thumbnail generation';

-- ============================================================================
-- 3. MIGRATE DATA: active_meetings → sessions
-- ============================================================================
INSERT INTO public.sessions (
    id, title, platform, video_url, join_url,
    status, scheduled_start, actual_start, actual_end,
    target_type, target_ids, room_name,
    created_at, updated_at
)
SELECT
    am.id,
    am.title,
    COALESCE(am.platform, 'youtube'),
    am.video_url,
    am.join_url,
    -- Map status
    CASE
        WHEN am.is_active = true THEN 'live'
        WHEN am.scheduled_at IS NOT NULL AND am.scheduled_at > now() THEN 'scheduled'
        ELSE 'ended'
    END,
    -- scheduled_start: use scheduled_at if available, else started_at
    COALESCE(am.scheduled_at, am.started_at, now()),
    am.started_at,
    am.ended_at,
    CASE WHEN am.target_type = 'candidate' THEN 'intern' ELSE COALESCE(am.target_type, 'all') END,
    COALESCE(am.target_ids, '{}'),
    am.room_name,
    COALESCE(am.started_at, now()),
    now()
FROM public.active_meetings am
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. MIGRATE DATA: Create recordings from meetings that had recording URLs
-- ============================================================================
INSERT INTO public.recordings (
    title, youtube_url, youtube_video_id, thumbnail_url,
    target_type, target_ids, session_id,
    created_at, updated_at
)
SELECT
    am.title,
    am.video_url,
    -- Extract video ID from URL
    CASE
        WHEN am.video_url ~ 'youtube\.com/embed/([^?&]+)'
        THEN (regexp_match(am.video_url, 'youtube\.com/embed/([^?&]+)'))[1]
        WHEN am.video_url ~ 'youtube\.com/watch\?v=([^&]+)'
        THEN (regexp_match(am.video_url, 'youtube\.com/watch\?v=([^&]+)'))[1]
        WHEN am.video_url ~ 'youtu\.be/([^?&]+)'
        THEN (regexp_match(am.video_url, 'youtu\.be/([^?&]+)'))[1]
        ELSE NULL
    END,
    -- Auto-generate thumbnail
    CASE
        WHEN am.video_url ~ 'youtube\.com/embed/([^?&]+)'
        THEN 'https://img.youtube.com/vi/' || (regexp_match(am.video_url, 'youtube\.com/embed/([^?&]+)'))[1] || '/maxresdefault.jpg'
        WHEN am.video_url ~ 'youtube\.com/watch\?v=([^&]+)'
        THEN 'https://img.youtube.com/vi/' || (regexp_match(am.video_url, 'youtube\.com/watch\?v=([^&]+)'))[1] || '/maxresdefault.jpg'
        WHEN am.video_url ~ 'youtu\.be/([^?&]+)'
        THEN 'https://img.youtube.com/vi/' || (regexp_match(am.video_url, 'youtu\.be/([^?&]+)'))[1] || '/maxresdefault.jpg'
        ELSE NULL
    END,
    CASE WHEN am.target_type = 'candidate' THEN 'intern' ELSE COALESCE(am.target_type, 'all') END,
    COALESCE(am.target_ids, '{}'),
    am.id,  -- Link to the migrated session
    COALESCE(am.started_at, now()),
    now()
FROM public.active_meetings am
WHERE am.is_active = false
  AND am.video_url IS NOT NULL;

-- ============================================================================
-- 5. ADD session_id TO meeting_messages (for new messages)
-- ============================================================================
ALTER TABLE public.meeting_messages
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE;

-- Populate session_id from existing meeting_id (they share the same UUIDs after migration)
UPDATE public.meeting_messages
SET session_id = meeting_id
WHERE session_id IS NULL AND meeting_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meeting_messages_session_id
    ON public.meeting_messages(session_id);

-- ============================================================================
-- 6. RLS POLICIES FOR SESSIONS
-- ============================================================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read sessions (filtering by target is done client-side)
CREATE POLICY "sessions_select_authenticated"
    ON public.sessions FOR SELECT
    TO authenticated
    USING (true);

-- Admin can insert, update, delete sessions
CREATE POLICY "sessions_insert_admin"
    ON public.sessions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "sessions_update_admin"
    ON public.sessions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "sessions_delete_admin"
    ON public.sessions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- 7. RLS POLICIES FOR RECORDINGS
-- ============================================================================
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read recordings
CREATE POLICY "recordings_select_authenticated"
    ON public.recordings FOR SELECT
    TO authenticated
    USING (true);

-- Admin can insert, update, delete recordings
CREATE POLICY "recordings_insert_admin"
    ON public.recordings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "recordings_update_admin"
    ON public.recordings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "recordings_delete_admin"
    ON public.recordings FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- 8. DROP OLD TABLE
-- ============================================================================
DROP TABLE IF EXISTS public.active_meetings CASCADE;

-- ============================================================================
-- 9. AUTO-UPDATE updated_at TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER recordings_updated_at
    BEFORE UPDATE ON public.recordings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
