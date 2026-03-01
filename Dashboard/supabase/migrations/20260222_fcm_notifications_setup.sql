-- ========================================
-- FCM Notifications Setup
-- ========================================

-- 1. Add FCM token column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- 2. Create admin_notifications table for push history
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    sent_to TEXT DEFAULT 'all',
    sent_count INTEGER DEFAULT 0
);

-- RLS: Only admins can insert/read admin_notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins full access to admin_notifications"
    ON admin_notifications
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM admin_credentials WHERE id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM admin_credentials WHERE id = auth.uid())
    );

-- Allow authenticated users (interns) to read (for potential future use)
CREATE POLICY "Authenticated users can read admin_notifications"
    ON admin_notifications
    FOR SELECT
    USING (auth.role() = 'authenticated');
