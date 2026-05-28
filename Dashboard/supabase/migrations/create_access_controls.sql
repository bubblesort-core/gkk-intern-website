-- Create access_controls table
CREATE TABLE IF NOT EXISTS access_controls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL means ALL users
    page_identifier TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT true,
    reason TEXT DEFAULT 'Maintenance in progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE access_controls
    ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'all';

ALTER TABLE access_controls
    ADD COLUMN IF NOT EXISTS target_batch_id UUID REFERENCES batches(id) ON DELETE CASCADE;

ALTER TABLE access_controls
    ADD COLUMN IF NOT EXISTS target_intern_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE access_controls
    ADD COLUMN IF NOT EXISTS target_email TEXT;

UPDATE access_controls
SET target_type = CASE
    WHEN target_email IS NOT NULL THEN 'email'
    WHEN target_batch_id IS NOT NULL THEN 'batch'
    WHEN target_intern_id IS NOT NULL THEN 'intern'
    WHEN target_user_id IS NOT NULL THEN 'intern'
    ELSE 'all'
END
WHERE target_type IS NULL OR target_type = '';

DROP POLICY IF EXISTS "Admins can do everything on access_controls" ON access_controls;
DROP POLICY IF EXISTS "Interns can read applicable locks" ON access_controls;

-- RLS Policies
ALTER TABLE access_controls ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on access_controls"
ON access_controls
FOR ALL
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Interns can read locks applicable to them
CREATE POLICY "Interns can read applicable locks"
ON access_controls
FOR SELECT
USING (
  is_locked = true
  AND (
    target_type = 'all'
    OR (target_type = 'email' AND target_email = auth.jwt() ->> 'email')
    OR (target_type = 'intern' AND target_intern_id = auth.uid())
    OR (target_type = 'batch' AND target_batch_id IN (
        SELECT t.batch_id
        FROM team_members tm
        INNER JOIN teams t ON t.id = tm.team_id
        WHERE tm.user_id = auth.uid()
      ))
  )
);

