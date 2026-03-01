-- NUCLEAR CLEANUP for Admin User
-- To fix the "403" Hook Error, we need to ensure NO conflicting data exists.

-- 1. Delete from public.profiles (The likely cause of the 403)
DELETE FROM public.profiles 
WHERE email IN ('noreply.gkk26@gmail.com', 'noreplay.gkk26@gmail.com');

-- 2. Delete from auth.users (In case a partial signup exists)
-- Note: You usually can't delete from auth.users directly in SQL Editor unless you are a superuser.
-- But we can try. If this fails, the user might need to delete it from the Supabase Dashboard.
DELETE FROM auth.users 
WHERE email IN ('noreply.gkk26@gmail.com', 'noreplay.gkk26@gmail.com');

-- 3. Reset admin_credentials to ensure it's ready for linking
UPDATE public.admin_credentials
SET auth_email = 'noreplay.gkk26@gmail.com', -- User requested 'noreplay'
    username = 'admingkk2026'
WHERE auth_email IN ('noreply.gkk26@gmail.com', 'noreplay.gkk26@gmail.com')
   OR username IN ('noreply.gkk26@gmail.com', 'noreplay.gkk26@gmail.com');

-- 4. Verify emptiness
SELECT * FROM public.profiles WHERE email LIKE '%gkk26@gmail.com';
