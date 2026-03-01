-- FIX: Allow public read access to admin_credentials for Login
-- Required because the Login Page (Anon user) needs to query this table to find the admin.

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.admin_credentials;

CREATE POLICY "Allow public read access"
ON public.admin_credentials
FOR SELECT
TO anon, authenticated, service_role
USING (true); -- Allow reading all rows (logic filters by username/password)

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
