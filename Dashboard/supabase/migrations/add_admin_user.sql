-- Add your email to admin_credentials so RLS policies allow you to act as Admin.
-- The RLS policy checks: WHERE username = auth.jwt()->>'email'
-- So we must add your EMAIL as the username.

INSERT INTO public.admin_credentials (username, password_hash, display_name, is_active)
VALUES 
    ('noreplay.gkk26@gmail.com', 'placeholder_hash_not_used_for_sso', 'GKK Admin', true)
ON CONFLICT (username) DO NOTHING;

-- Verify it exists
SELECT * FROM public.admin_credentials WHERE username = 'noreplay.gkk26@gmail.com';
