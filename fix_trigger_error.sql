-- FIX: Remove reference to non-existent 'admins' table
-- This function is causing the "relation public.admins does not exist" error

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Only look at the valid table 'admin_credentials'
  RETURN EXISTS (
    SELECT 1 FROM public.admin_credentials WHERE id = auth.uid()
  ); 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
