-- Fix RLS Policies for Admin Ticket Creation
-- Problem: Admins cannot create tickets (Direct Messages start as new tickets), causing 403 Forbidden.
-- Fix: Add a policy allowing admins to INSERT into public.tickets.

-- Admins can create tickets (for Direct Messages)
CREATE POLICY "Admins can create tickets" 
ON public.tickets FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac 
        WHERE lower(ac.username) = lower(auth.jwt() ->> 'email')
        AND ac.is_active = true
    )
);

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
