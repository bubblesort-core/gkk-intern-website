-- Add remark column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS remark TEXT DEFAULT '';
