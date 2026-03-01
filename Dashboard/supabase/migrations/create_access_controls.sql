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
  (target_user_id IS NULL OR target_user_id = auth.uid()) 
  AND is_locked = true
);
