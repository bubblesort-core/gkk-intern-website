-- ============================================
-- Form Settings Table for Admin Availability Control
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create the form_settings table
CREATE TABLE IF NOT EXISTS form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  available_days INTEGER[] DEFAULT ARRAY[0, 1, 6], -- 0=Sunday, 1=Monday, 6=Saturday
  available_dates TEXT[] DEFAULT ARRAY[]::TEXT[], -- Specific dates in YYYY-MM-DD format
  time_slots TEXT[] DEFAULT ARRAY['18:00', '18:30', '19:00', '19:30', '20:00'],
  is_form_locked BOOLEAN DEFAULT false,
  lock_message TEXT DEFAULT 'Applications are currently closed. Please contact the admin for more information.',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings row (singleton pattern)
INSERT INTO form_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE form_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read form settings (needed for apply form)
CREATE POLICY "Anyone can read form settings" 
ON form_settings 
FOR SELECT 
USING (true);

-- Policy: Allow updates for all authenticated users (admin check happens in app)
-- Note: For stricter security, you could add admin table check
CREATE POLICY "Authenticated users can update form settings" 
ON form_settings 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create function to update timestamp on changes
CREATE OR REPLACE FUNCTION update_form_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp update
DROP TRIGGER IF EXISTS form_settings_updated_at ON form_settings;
CREATE TRIGGER form_settings_updated_at
  BEFORE UPDATE ON form_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_form_settings_timestamp();
