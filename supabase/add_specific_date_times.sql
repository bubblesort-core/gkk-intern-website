-- Migration script to add specific_date_times to form_settings

ALTER TABLE form_settings ADD COLUMN IF NOT EXISTS specific_date_times JSONB DEFAULT '{}'::jsonb;

-- Example of structure:
-- {
--   "2026-03-15": ["10:00", "10:30"],
--   "2026-03-16": ["14:00", "15:00"]
-- }
