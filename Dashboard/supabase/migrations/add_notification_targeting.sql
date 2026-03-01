-- Add targeting columns to admin_notifications for audit trail
ALTER TABLE admin_notifications
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS target_ids text[] DEFAULT '{}';
