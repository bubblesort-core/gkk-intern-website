-- Fix Admin Profile Missing Error
-- Error: insert or update on table "tickets" violates foreign key constraint "tickets_assigned_to_fkey"
-- Cause: The Admin User ID exists in auth.users and admin_credentials, but NOT in public.profiles.
-- Fix: Insert a profile record for the Admin.

INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
    id, 
    email, 
    'GKK Admin', 
    'admin', 
    'active'
FROM auth.users
WHERE email = 'noreplay.gkk26@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT * FROM public.profiles WHERE email = 'noreplay.gkk26@gmail.com';
