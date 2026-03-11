-- ============================================
-- Workshop Management Table
-- ============================================

CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  cta_link TEXT,
  cta_text TEXT DEFAULT 'Learn More',
  is_active BOOLEAN DEFAULT false,
  timer_duration INTEGER DEFAULT 5, -- seconds
  instructor_name TEXT,
  session_date TEXT,
  session_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active workshops
DROP POLICY IF EXISTS "Anyone can read active workshops" ON workshops;
CREATE POLICY "Anyone can read active workshops" 
ON workshops FOR SELECT 
USING (is_active = true);

-- Policy: Admin can do anything
DROP POLICY IF EXISTS "Admin has full access to workshops" ON workshops;
CREATE POLICY "Admin has full access to workshops" 
ON workshops FOR ALL
USING (auth.email() = 'noreplay.gkk26@gmail.com');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_workshop_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workshop_updated_at ON workshops;
CREATE TRIGGER workshop_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW
  EXECUTE FUNCTION update_workshop_timestamp();
