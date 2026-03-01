-- Ensure permissions are explicitly granted
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant execute on the critical function
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon; -- Allow anon to try (will return false)

-- Ensure profiles are readable by authenticated users (RLS handles the rest)
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- Ensure tickets/messages are accessible
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO authenticated;
GRANT ALL ON public.tickets TO service_role;
GRANT ALL ON public.ticket_messages TO service_role;
