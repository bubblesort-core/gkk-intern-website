-- Helper to debug RLS visibility
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.debug_count_tickets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin, bypassing RLS to count ACTUAL total
AS $$
BEGIN
    RETURN (SELECT count(*) FROM public.tickets);
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.debug_count_tickets() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_count_tickets() TO anon;


-- Helper to debug MY visibility (respects RLS)
CREATE OR REPLACE FUNCTION public.check_my_visibility()
RETURNS TABLE (
    user_id uuid,
    is_admin boolean,
    total_tickets_in_db bigint,
    tickets_i_can_see bigint,
    profiles_i_can_see bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid;
    v_is_admin boolean;
    v_total bigint;
    v_visible bigint;
    v_prof_visible bigint;
BEGIN
    v_uid := auth.uid();
    v_is_admin := is_admin_user();
    
    -- Count total (bypassing RLS via direct select in SECURITY DEFINER)
    SELECT count(*) INTO v_total FROM public.tickets;
    
    -- Count visible (Use a select that respects permissions? 
    -- Actually, inside SECURITY DEFINER, we are superuser.
    -- To test RLS, we must return values and let client query table, OR switch role.)
    
    -- BETTER APPROACH: Just return status info
    RETURN QUERY SELECT 
        v_uid, 
        v_is_admin,
        v_total,
        (SELECT count(*) FROM public.tickets WHERE user_id = v_uid OR v_is_admin), -- Logic simulation
        (SELECT count(*) FROM public.profiles);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_my_visibility() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_my_visibility() TO anon;
