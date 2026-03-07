-- ============================================
-- Add Application Batch Tracking
-- ============================================

-- 1. Add active_batch to form setting
ALTER TABLE form_settings ADD COLUMN IF NOT EXISTS active_batch TEXT DEFAULT 'Batch 1';

-- 2. Add batch_number to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS batch_number VARCHAR DEFAULT 'Batch 1';
