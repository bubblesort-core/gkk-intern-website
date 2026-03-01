-- RESTORE THE INTERN SIGNUP FLOW
-- We previously dropped this trigger to fix the Admin.
-- Now we must put it back so Interns get profiles when they sign up.

-- 1. Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
