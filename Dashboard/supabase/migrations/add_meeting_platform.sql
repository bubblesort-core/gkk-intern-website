-- Add platform and join_url columns to active_meetings table

ALTER TABLE active_meetings 
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'youtube' CHECK (platform IN ('youtube', 'google_meet')),
ADD COLUMN IF NOT EXISTS join_url text;


-- Update existing rows to have platform 'youtube' (already handled by default, but good to be explicit)
UPDATE active_meetings SET platform = 'youtube' WHERE platform IS NULL;
