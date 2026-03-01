-- ==========================================
-- MANUAL USER UNLOCK SCRIPT
-- ==========================================
-- Usage:
-- 1. Replace 'student@example.com' with the email address of the user you want to unlock.
-- 2. Run this script in the Supabase SQL Editor.

-- 1. Unlock the user profile
UPDATE profiles
SET status = 'active'
WHERE email = 'student@example.com'; -- <--- CHANGE THIS EMAIL!

-- 2. (Optional) Insert a manual payment record so the admin dashboard sees it
INSERT INTO payments (
    user_id,
    amount,
    currency,
    status,
    payment_method,
    completed_at,
    customer_email,
    customer_name
)
SELECT 
    id, 
    1.00, 
    'INR', 
    'captured', 
    'manual_unlock', 
    NOW(), 
    email, 
    full_name
FROM profiles
WHERE email = 'student@example.com' -- <--- CHANGE THIS EMAIL!
AND NOT EXISTS (
    SELECT 1 FROM payments WHERE customer_email = 'student@example.com'
);
