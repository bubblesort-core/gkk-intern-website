-- Clean up existing admin profile to allow fresh signup
-- The signup process likely fails because a profile with this email already exists, 
-- causing the 'handle_new_user' trigger to fail.

DELETE FROM public.profiles 
WHERE email = 'noreply.gkk26@gmail.com' 
   OR email = 'noreplay.gkk26@gmail.com'; -- Catch typo

-- Verify deletion
SELECT * FROM public.profiles WHERE email LIKE '%gkk26@gmail.com';
