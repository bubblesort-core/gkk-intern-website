-- Fix RLS Policies for admin_notifications
-- Problem: Admins cannot insert into admin_notifications because auth.uid() doesn't match admin_credentials.id in the current setup.
-- Fix: Check against auth.jwt() ->> 'email' like other admin tables.

DROP POLICY IF EXISTS "Admins full access to admin_notifications" ON admin_notifications;

CREATE POLICY "Admins full access to admin_notifications"
    ON admin_notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_credentials ac 
            WHERE (lower(ac.username) = lower(auth.jwt() ->> 'email') OR lower(ac.auth_email) = lower(auth.jwt() ->> 'email'))
            AND ac.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_credentials ac 
            WHERE (lower(ac.username) = lower(auth.jwt() ->> 'email') OR lower(ac.auth_email) = lower(auth.jwt() ->> 'email'))
            AND ac.is_active = true
        )
    );

NOTIFY pgrst, 'reload config';
