-- 1. Ensure the auth_email column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_credentials' AND column_name = 'auth_email') THEN
        ALTER TABLE public.admin_credentials ADD COLUMN auth_email TEXT;
    END IF;
END $$;

-- 2. Update the existing 'admingkk2026' user to use the correct Auth Email (with the typo)
-- This links your login 'admingkk2026' -> Auth User 'noreplay.gkk26@gmail.com'
UPDATE public.admin_credentials
SET auth_email = 'noreplay.gkk26@gmail.com'
WHERE username = 'admingkk2026';

-- 3. (Optional) Cleanup the old record if needed
DELETE FROM public.admin_credentials 
WHERE username = 'noreplay.gkk26@gmail.com' 
AND username != 'admingkk2026';

-- Verify
SELECT * FROM public.admin_credentials WHERE username = 'admingkk2026';
