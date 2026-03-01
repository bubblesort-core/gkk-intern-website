-- ============================================
-- GKK-HIRE REWARDS SYSTEM SCHEMA
-- ============================================

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    coupon_code TEXT NOT NULL UNIQUE,
    description TEXT,
    expiry_text TEXT,
    image_url TEXT,
    value TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_assignments table (linking rewards to users)
CREATE TABLE IF NOT EXISTS reward_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reward_assignments_reward_id ON reward_assignments(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_assignments_user_id ON reward_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_coupon_code ON rewards(coupon_code);

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_assignments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (if not exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for rewards table
-- Admins can do everything
CREATE POLICY "Admins can manage rewards" ON rewards
    FOR ALL
    USING (public.is_admin());

-- Users can view active rewards
CREATE POLICY "Users can view active rewards" ON rewards
    FOR SELECT
    USING (is_active = true);

-- RLS Policies for reward_assignments table
-- Admins can do everything
CREATE POLICY "Admins can manage reward assignments" ON reward_assignments
    FOR ALL
    USING (public.is_admin());

-- Users can view their own assignments
CREATE POLICY "Users can view own reward assignments" ON reward_assignments
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own assignments (for marking as redeemed)
CREATE POLICY "Users can update own reward assignments" ON reward_assignments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON rewards TO authenticated;
GRANT ALL ON reward_assignments TO authenticated;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rewards_updated_at ON rewards;
CREATE TRIGGER rewards_updated_at
    BEFORE UPDATE ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

-- Sample rewards (optional - uncomment to add)
/*
INSERT INTO rewards (title, coupon_code, description, expiry_text, image_url, value) VALUES
('Amazon Gift Card', 'GKKAMZ2026', 'Amazon gift card for outstanding performance', 'Valid until December 31, 2026', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400', '₹500'),
('LinkedIn Premium', 'GKKLINK2026', '1 month of LinkedIn Premium for networking', 'Valid for 3 months after assignment', 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=400', '1 Month Free'),
('Udemy Course', 'GKKUDEMY2026', 'Free access to any Udemy course of your choice', 'Valid until June 30, 2026', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400', 'Any Course'),
('Certificate of Excellence', 'GKKCERT2026', 'Official certificate for exceptional work', 'No expiry', 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=400', 'Certificate');
*/
