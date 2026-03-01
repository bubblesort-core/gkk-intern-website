-- ==========================================
-- FIX LEADERBOARD RETURN TYPE MISMATCH
-- ==========================================
-- Error: "Returned type integer does not match expected type bigint in column 2"
-- The profiles table uses 'integer' for xp/current_streak, but the function declared 'bigint'.

DROP FUNCTION IF EXISTS public.get_public_leaderboard();

CREATE OR REPLACE FUNCTION public.get_public_leaderboard()
RETURNS TABLE (
    full_name text,
    xp integer,
    current_streak integer,
    avatar_url text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.full_name,
        COALESCE(p.xp, 0)::integer as xp,
        COALESCE(p.current_streak, 0)::integer as current_streak,
        p.avatar_url
    FROM public.profiles p
    WHERE p.email NOT IN ('p.pradhan3172@gmail.com', 'noreplay.gkk26@gmail.com')
    AND p.full_name NOT ILIKE '%Test%'
    ORDER BY p.xp DESC
    LIMIT 10;
END;
$$;
