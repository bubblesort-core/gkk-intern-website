-- Fix the unlinked payment for p.pradhan3172@gmail.com
-- 1. Updates user_id to match the current profile
-- 2. Sets customer_email so fallback linking works
-- 3. Updates status to 'completed' (standardizing)

UPDATE payments
SET 
  user_id = (SELECT id FROM profiles WHERE email = 'p.pradhan3172@gmail.com'),
  customer_email = 'p.pradhan3172@gmail.com',
  status = 'completed'
WHERE razorpay_payment_id = 'pay_S9kTKAbPsrlOh4';
