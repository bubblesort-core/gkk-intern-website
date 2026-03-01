-- ============================================
-- DEPLOYMENT SCRIPT: REFERRAL FIXES
-- Run this in your Supabase SQL Editor to apply fixes
-- ============================================

-- 1. UPGRADE CLAIM REFERRAL (Fixes "Missing Reward" Bug)
-- This version awards XP even if the user was already linked but missed the bonus
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

-- 2. UPGRADE REWARD COMPLETION (Fixes "Broken Link" Bug)
-- This version 'heals' the system by creating a tracking record if one is missing
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

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION claim_referral TO authenticated;
GRANT EXECUTE ON FUNCTION complete_referral_reward TO service_role;
GRANT EXECUTE ON FUNCTION complete_referral_reward TO authenticated;
