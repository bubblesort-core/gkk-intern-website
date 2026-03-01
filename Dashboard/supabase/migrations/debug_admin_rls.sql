-- Create a debug function to inspect RLS context
CREATE OR REPLACE FUNCTION public.debug_admin_rls()
RETURNS TABLE (
    jwt_email text,
    auth_uid uuid,
    admin_found boolean,
    admin_username text,
    admin_auth_email text,
    is_admin_check boolean
) 
SECURITY DEFINER
AS $$
DECLARE
    _jwt_email text;
    _auth_uid uuid;
    _admin_record record;
BEGIN
    _jwt_email := auth.jwt()->>'email';
    _auth_uid := auth.uid();
    
    SELECT * INTO _admin_record FROM public.admin_credentials 
    WHERE (username = _jwt_email OR auth_email = _jwt_email)
    LIMIT 1;

    RETURN QUERY SELECT 
        _jwt_email,
        _auth_uid,
        (_admin_record IS NOT NULL),
        _admin_record.username::text,
        _admin_record.auth_email::text,
        public.is_admin_user();
END;
$$ LANGUAGE plpgsql;
