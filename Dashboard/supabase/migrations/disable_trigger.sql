-- TEMPORARY FIX: Disable the trigger that is causing the 403 error
-- We will manually insert the profile record after signup if needed.

-- Try to drop the trigger if we can identify its name (standard name is on_auth_user_created)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Alternative: If we can't drop it, we can try to make the function do nothing (if we knew its name).
-- But dropping the trigger is the most direct way to stop the 403.

-- If the trigger was "on_auth_user_created", this will allow the signup to proceed.
-- After you sign up, we will run 'fix_admin_profile.sql' to ensure the profile exists.
