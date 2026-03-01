-- ============================================
-- ENGAGEMENT FEATURES SCHEMA
-- GKK-Hire Intern Dashboard
-- ============================================

-- ===========================================
-- 1. PROFILE ENHANCEMENTS
-- ===========================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"github": "", "linkedin": "", "website": ""}'::jsonb;

-- ===========================================
-- 2. RESOURCES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'frontend', 'backend', 'design', 'career'
    icon TEXT DEFAULT 'fas fa-book',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on resources" ON resources;
CREATE POLICY "Allow public read access on resources" ON resources
    FOR SELECT USING (true);

-- ===========================================
-- 3. SYSTEM CONFIG (Admin-Editable Settings)
-- ===========================================
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 6. PUBLIC LEADERBOARD RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_public_leaderboard()
RETURNS TABLE (
  full_name TEXT,
  avatar_url TEXT,
  xp INTEGER,
  current_streak INTEGER,
  level INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Calculate level dynamically based on XP (simple floor division for now)
  -- Assuming 100 XP per level for simplicity, or use existing logic if compatible
  SELECT 
    full_name, 
    avatar_url, 
    xp, 
    current_streak, 
    (xp / 100) + 1 as level 
  FROM profiles
  WHERE full_name IS NOT NULL 
    AND full_name != 'Anonymous'
  ORDER BY xp DESC
  LIMIT 10;
$$;

-- Grant access to anon (public) role
GRANT EXECUTE ON FUNCTION get_public_leaderboard TO anon;
GRANT EXECUTE ON FUNCTION get_public_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_leaderboard TO service_role;

-- ===========================================
-- 7. STREAK ALERT RPC
-- ===========================================
CREATE OR REPLACE FUNCTION get_top_streak_user()
RETURNS TABLE (
  full_name TEXT,
  avatar_url TEXT,
  current_streak INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT full_name, avatar_url, current_streak
  FROM profiles
  WHERE current_streak > 0
  ORDER BY current_streak DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_top_streak_user TO anon;
GRANT EXECUTE ON FUNCTION get_top_streak_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_streak_user TO service_role;

-- ===========================================
-- 4. COUPONS / REWARDS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT, -- e.g., "Amazon ₹500 Gift Card"
    value TEXT, -- e.g., "₹500" or "Free Course"
    image_url TEXT, -- Image to display with the coupon (e.g., brand logo)
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'redeemed')),
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add image_url column if table already exists
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Service role (admin API) can do anything - no dependency on admins table
DROP POLICY IF EXISTS "Service role full access on coupons" ON coupons;
CREATE POLICY "Service role full access on coupons" ON coupons FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Authenticated users can insert coupons (for admin dashboard)
DROP POLICY IF EXISTS "Authenticated can manage coupons" ON coupons;
CREATE POLICY "Authenticated can manage coupons" ON coupons FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Users can see their own assigned coupons
DROP POLICY IF EXISTS "Users can view own coupons" ON coupons;
CREATE POLICY "Users can view own coupons" ON coupons FOR SELECT USING (
    assigned_to = auth.uid()
);

-- ===========================================
-- 5. PUBLIC LEADERBOARD VIEW (Safe Data Exposure)
-- ===========================================
CREATE OR REPLACE VIEW public_leaderboard AS 
SELECT 
    id as user_id,
    full_name,
    avatar_url,
    xp,
    level,
    current_streak
FROM profiles 
WHERE status = 'active'
ORDER BY xp DESC
LIMIT 50;

-- Grant access to anonymous and authenticated users
GRANT SELECT ON public_leaderboard TO anon, authenticated;

-- ===========================================
-- 6. REWARD ASSIGNMENT FUNCTION & TRIGGER
-- ===========================================

-- Function: Assign coupon to team members when project is approved
CREATE OR REPLACE FUNCTION assign_team_rewards()
RETURNS TRIGGER AS $$
DECLARE
    threshold INTEGER;
    team_id_val UUID;
    completed_count INTEGER;
    member RECORD;
    available_coupon RECORD;
BEGIN
    -- Only trigger on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Get reward threshold from config
        SELECT (value)::integer INTO threshold FROM system_config WHERE key = 'reward_threshold';
        IF threshold IS NULL THEN threshold := 5; END IF;
        
        -- Get team_id from the submission
        team_id_val := NEW.team_id;
        
        -- Count completed projects for this team
        SELECT COUNT(*) INTO completed_count
        FROM project_submissions ps
        WHERE ps.team_id = team_id_val AND ps.status = 'approved';
        
        -- Check if this is a milestone (every N projects)
        IF completed_count > 0 AND (completed_count % threshold) = 0 THEN
            
            -- For each team member, assign an available coupon
            FOR member IN 
                SELECT user_id FROM team_members WHERE team_id = team_id_val
            LOOP
                -- Find an available coupon
                SELECT * INTO available_coupon FROM coupons 
                WHERE status = 'available' 
                ORDER BY created_at ASC 
                LIMIT 1 
                FOR UPDATE SKIP LOCKED;
                
                IF available_coupon IS NOT NULL THEN
                    -- Assign the coupon
                    UPDATE coupons 
                    SET status = 'assigned', 
                        assigned_to = member.user_id, 
                        assigned_at = NOW()
                    WHERE id = available_coupon.id;
                    
                    -- Award bonus XP
                    UPDATE profiles 
                    SET xp = xp + 100 
                    WHERE id = member.user_id;
                END IF;
            END LOOP;
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_assign_rewards ON project_submissions;
CREATE TRIGGER trigger_assign_rewards
    AFTER UPDATE ON project_submissions
    FOR EACH ROW
    EXECUTE FUNCTION assign_team_rewards();
