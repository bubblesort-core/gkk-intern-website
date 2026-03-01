-- Add targeting columns to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'all' CHECK (target_type IN ('all', 'interns', 'teams', 'batches')),
ADD COLUMN IF NOT EXISTS target_ids jsonb DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.announcements.target_type IS 'Target audience type: all, interns, teams, batches';
COMMENT ON COLUMN public.announcements.target_ids IS 'JSON array of target IDs (UUIDs for interns/teams, strings for batches)';

-- Create indexes for performance (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_announcements_target_type ON public.announcements(target_type);
CREATE INDEX IF NOT EXISTS idx_announcements_target_ids ON public.announcements USING gin(target_ids);

-- Create RPC function to fetch targeted announcements efficiently
CREATE OR REPLACE FUNCTION get_targeted_announcements(
  p_user_id uuid,
  p_team_id uuid DEFAULT NULL,
  p_batch text DEFAULT NULL
)
RETURNS SETOF announcements
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM announcements
  WHERE 
    -- 1. Expiry check (show active only)
    (expires_at IS NULL OR expires_at > now())
    AND (
      -- 2. Target Logic
      
      -- Case A: 'all' -> Show to everyone
      target_type = 'all'
      
      -- Case B: 'interns' -> Show if user ID is in target_ids
      OR (target_type = 'interns' AND target_ids @> jsonb_build_array(p_user_id::text))
      
      -- Case C: 'teams' -> Show if team ID is in target_ids (and user has a team)
      OR (target_type = 'teams' AND p_team_id IS NOT NULL AND target_ids @> jsonb_build_array(p_team_id::text))
      
      -- Case D: 'batches' -> Show if batch is in target_ids (and user has a batch)
      OR (target_type = 'batches' AND p_batch IS NOT NULL AND target_ids @> jsonb_build_array(p_batch))
    )
  ORDER BY is_pinned DESC, created_at DESC;
END;
$$;
