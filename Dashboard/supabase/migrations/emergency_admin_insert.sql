-- EMERGENCY MANUAL INSERT
-- If the API is failing (500), we can try to insert directly into auth.users.
-- This requires the pgsodium extension (usually enabled) or we just use a placeholder hash.

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'noreplay.gkk26@gmail.com',
    crypt('admin123!', gen_salt('bf')), -- Uses pgcrypto
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- Ensure profile exists
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT id, email, 'GKK Admin', 'admin', 'active'
FROM auth.users
WHERE email = 'noreplay.gkk26@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT * FROM auth.users WHERE email = 'noreplay.gkk26@gmail.com';
