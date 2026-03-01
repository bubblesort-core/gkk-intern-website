-- ============================================
-- REFERRAL SYSTEM SCHEMA
-- ============================================

-- 1. PROFILE ENHANCEMENTS
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- 2. REFERRALS TABLE (Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS referral_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES profiles(id) NOT NULL,
    referred_user_id UUID REFERENCES profiles(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')), -- pending until first check-in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(referred_user_id) -- One referral per user
);

ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;

-- 3. CODE GENERATION TRIGGER
--Format: GKK + FirstName + 5 Random Digits (e.g., GKKDebraj12345)
-- ============================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    clean_name TEXT;
    rnd_code TEXT;
    final_code TEXT;
    exists_check BOOLEAN;
BEGIN
    -- Only generate if not present
    IF NEW.referral_code IS NULL THEN
        -- Get first word of name, remove non-alphanumeric, camelCase logic effectively
        clean_name := REPLACE(INITCAP(SPLIT_PART(NEW.full_name, ' ', 1)), ' ', '');
        
        -- Fallback if name is empty
        IF clean_name IS NULL OR clean_name = '' THEN
            clean_name := 'Intern';
        END IF;
        
        LOOP
            -- Generate 5 digit random number
            rnd_code := FLOOR(10000 + RANDOM() * 89999)::TEXT;
            final_code := 'GKK' || clean_name || rnd_code;
            
            -- Check uniqueness
            SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = final_code) INTO exists_check;
            
            IF NOT exists_check THEN
                NEW.referral_code := final_code;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
DROP TRIGGER IF EXISTS trigger_gen_referral_code ON profiles;
CREATE TRIGGER trigger_gen_referral_code
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- 4. VALIDATE REFERRAL CODE (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION validate_referral_code(code_input TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    referrer_name TEXT,
    referrer_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true,
        p.full_name,
        p.id
    FROM profiles p
    WHERE p.referral_code = code_input;

    -- If no rows returned
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID;
    END IF;
END;
$$;

-- Grant access to public (for signup form)
GRANT EXECUTE ON FUNCTION validate_referral_code TO anon;
GRANT EXECUTE ON FUNCTION validate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION validate_referral_code TO service_role;

-- 5. CLAIM REFERRAL (RPC)
-- Called by the new user after signup
-- ============================================
CREATE OR REPLACE FUNCTION claim_referral(code_used TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ref_id UUID;
    new_user_id UUID;
BEGIN
    new_user_id := auth.uid();
    
    -- Prevent self-referral
    SELECT id INTO ref_id FROM profiles WHERE referral_code = code_used;
    
    IF ref_id IS NOT NULL AND ref_id != new_user_id THEN
        -- Update new user profile (only if not already referred OR if referred but XP missing)
        UPDATE profiles 
        SET referred_by = ref_id,
            xp = COALESCE(xp, 0) + 50 -- Give +50 XP Head Start
        WHERE id = new_user_id 
        AND (referred_by IS NULL OR (referred_by = ref_id AND COALESCE(xp, 0) < 50));
        
        IF FOUND THEN
            -- Track the referral
            INSERT INTO referral_tracking (referrer_id, referred_user_id, status)
            VALUES (ref_id, new_user_id, 'pending')
            ON CONFLICT (referred_user_id) DO NOTHING;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_referral TO authenticated;

-- 6. COMPLETE REFERRAL (Reward Logic)
-- Call this when user does first Daily Check-in
-- ============================================
CREATE OR REPLACE FUNCTION complete_referral_reward(user_id_input UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r_record RECORD;
    current_count INTEGER;
    new_badges JSONB;
    user_referrer UUID;
BEGIN
    -- 1. Try to find existing pending tracking record
    SELECT * INTO r_record FROM referral_tracking 
    WHERE referred_user_id = user_id_input AND status = 'pending';
    
    -- 2. SELF-HEALING: If no tracking record, check if user actually has a referrer
    IF r_record IS NULL THEN
        SELECT referred_by INTO user_referrer FROM profiles WHERE id = user_id_input;
        
        IF user_referrer IS NOT NULL THEN
            -- Create the missing tracking record
            INSERT INTO referral_tracking (referrer_id, referred_user_id, status)
            VALUES (user_referrer, user_id_input, 'pending')
            ON CONFLICT (referred_user_id) DO NOTHING
            RETURNING * INTO r_record;
        END IF;
    END IF;

    -- 3. If we have a record (existing or just created), process reward
    IF r_record IS NOT NULL THEN
        -- Mark as completed
        UPDATE referral_tracking 
        SET status = 'completed', completed_at = NOW() 
        WHERE id = r_record.id;
        
        -- Reward Referrer (+100 XP)
        UPDATE profiles 
        SET xp = COALESCE(xp, 0) + 100,
            referral_count = COALESCE(referral_count, 0) + 1
        WHERE id = r_record.referrer_id;
        
        -- Check for Badge (10 Invites)
        SELECT referral_count INTO current_count FROM profiles WHERE id = r_record.referrer_id;
        
        IF current_count >= 10 THEN
            -- Add 'Community Builder' badge if not present
            UPDATE profiles
            SET badges = CASE 
                WHEN badges @> '[{"id": "community_builder"}]'::jsonb THEN badges
                ELSE badges || '[{"id": "community_builder", "name": "Community Builder", "icon": "fas fa-users", "description": "Invited 10+ amazing interns"}]'::jsonb
            END
            WHERE id = r_record.referrer_id;
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_referral_reward TO service_role;
GRANT EXECUTE ON FUNCTION complete_referral_reward TO authenticated;
