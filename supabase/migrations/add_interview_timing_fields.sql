-- Add interview timing fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS preferred_date VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_timing VARCHAR(50);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_preferred_date ON applications(preferred_date);
CREATE INDEX IF NOT EXISTS idx_preferred_timing ON applications(preferred_timing);
