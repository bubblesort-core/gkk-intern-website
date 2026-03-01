-- Ensure project_submissions table has all required columns
CREATE TABLE IF NOT EXISTS project_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS team_id uuid;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS github_url text;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS live_url text;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS submitted_by uuid;
ALTER TABLE project_submissions ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Add Foreign Key constraints only if they don't likely exist (hard to check in simple SQL script without procedural code, 
-- but we can try to add them if we are sure tables exist. For now, skipping constraints to avoid errors if they act up, 
-- focusing on columns).
