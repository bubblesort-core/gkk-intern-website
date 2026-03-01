-- ============================================
-- STREAK SYSTEM UPDATE
-- ============================================

-- Add longest_streak column to profiles if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'longest_streak'
    ) THEN
        ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing users to set longest_streak from current_streak
UPDATE profiles 
SET longest_streak = GREATEST(current_streak, COALESCE(longest_streak, 0))
WHERE current_streak IS NOT NULL;
