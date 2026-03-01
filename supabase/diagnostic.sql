-- ==============================================================================
-- DIAGNOSTIC SCRIPT - RUN THIS AND SHARE THE OUTPUT
-- ==============================================================================

-- 1. List all Triggers on auth.users
SELECT 
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- 2. List all Triggers on public.profiles
SELECT 
    event_object_schema as schema_name,
    event_object_table as table_name,
    trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'profiles' 
  AND event_object_schema = 'public';

-- 3. List all Columns in public.profiles to check for NOT NULL constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public';

-- 4. Try to create a simplified handle_new_user function (Safe Mode)
-- This tries to be as minimal as possible to see if it works.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Minimal INSERT - only ID and Email
  -- We use exception handling to ignore errors and allow signup even if profile fails
  -- This is TEMPORARY debugging to see if OTP sends.
  BEGIN
      INSERT INTO public.profiles (id, email, created_at)
      VALUES (NEW.id, NEW.email, NOW())
      ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
      -- Log the error to the Postgres logs (visible in Supabase Dashboard -> Database -> Postgres Logs)
      RAISE WARNING 'Error creating profile: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
