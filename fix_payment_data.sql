-- ============================================
-- DATA REPAIR SCRIPT: BACKFILL PAYMENT DETAILS
-- Run this in your Supabase SQL Editor
-- ============================================

-- This script copies the Name and Email from the 'profiles' table
-- into the 'payments' table for any records where they are missing.

UPDATE payments
SET 
  customer_name = profiles.full_name,
  customer_email = profiles.email
FROM profiles
WHERE payments.user_id = profiles.id
  AND (payments.customer_name IS NULL OR payments.customer_email IS NULL);

-- Result:
-- All past payments will now have the user's name and email "stamped" on them.
