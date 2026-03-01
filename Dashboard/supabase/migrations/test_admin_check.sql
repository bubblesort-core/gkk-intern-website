-- Test Admin Check Logic
-- Replace 'YOUR_ADMIN_EMAIL' with the actual email you are logged in with (or check auth.jwt() ->> 'email')
-- But since we can't easily mock auth.jwt() in the editor without a session, we will just check the table directly.

SELECT * FROM public.admin_credentials;

-- Check if RLS is enabled on tickets
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'tickets';

-- Check policies on tickets
SELECT * FROM pg_policies WHERE tablename = 'tickets';
