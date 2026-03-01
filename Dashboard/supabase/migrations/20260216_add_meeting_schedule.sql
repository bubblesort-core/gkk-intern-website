-- Add columns for scheduling and targeting
ALTER TABLE public.active_meetings 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'all', -- 'all', 'batch', 'team', 'candidate'
ADD COLUMN IF NOT EXISTS target_ids TEXT[]; -- Array of strings for multi-select

-- Create an index for faster queries on target_type
CREATE INDEX IF NOT EXISTS idx_active_meetings_target_type 
ON public.active_meetings (target_type);

-- Comment on columns
COMMENT ON COLUMN public.active_meetings.target_type IS 'Audience type: all, batch, team, candidate';
COMMENT ON COLUMN public.active_meetings.target_ids IS 'Array of IDs for specific batches, teams, or users';
