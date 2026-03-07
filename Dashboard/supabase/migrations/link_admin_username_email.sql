-- Add auth_email column to store the Supabase Auth email
ALTER TABLE public.admin_credentials 
ADD COLUMN IF NOT EXISTS auth_email TEXT;

-- Update the existing admin record
-- Set username to 'admin' (for login form)
-- Set auth_email to 'noreplay.gkk26@gmail.com' (for Supabase Auth)
UPDATE public.admin_credentials
SET 
    username = 'admingkk2026',
    auth_email = 'noreplay.gkk26@gmail.com'
WHERE 
    username = 'noreplay.gkk26@gmail.com' 
    OR username = 'noreplay.gkk26@gmail.com'; -- Catch typo just in case

-- Verify
SELECT * FROM public.admin_credentials;
