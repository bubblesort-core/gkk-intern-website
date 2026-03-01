-- Fix typo in admin email
UPDATE public.admin_credentials
SET username = 'noreply.gkk26@gmail.com'
WHERE username = 'noreplay.gkk26@gmail.com';

-- Verify
SELECT * FROM public.admin_credentials;
