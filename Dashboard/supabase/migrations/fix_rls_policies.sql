-- Fix RLS Policies for Admin Access
-- PREVIOUS ERROR: Policies were trying to SELECT from auth.users, which is restricted.
-- FIX: Use auth.jwt() ->> 'email' to get the current user's email safely.

-- 1. TICKETS TABLE POLICIES

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;

-- Admins can view all tickets (Safe Version)
CREATE POLICY "Admins can view all tickets" 
ON public.tickets FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac 
        WHERE ac.username = (select auth.jwt() ->> 'email')
        AND ac.is_active = true
    )
);

-- Admins can update tickets (Safe Version)
CREATE POLICY "Admins can update all tickets" 
ON public.tickets FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac 
        WHERE ac.username = (select auth.jwt() ->> 'email')
        AND ac.is_active = true
    )
);


-- 2. TICKET_MESSAGES TABLE POLICIES

DROP POLICY IF EXISTS "Admins can view all messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON public.ticket_messages;

-- Admins can view all messages (Safe Version)
CREATE POLICY "Admins can view all messages" 
ON public.ticket_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac 
        WHERE ac.username = (select auth.jwt() ->> 'email')
        AND ac.is_active = true
    )
);

-- Admins can send messages (Safe Version)
CREATE POLICY "Admins can send messages" 
ON public.ticket_messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_credentials ac 
        WHERE ac.username = (select auth.jwt() ->> 'email')
        AND ac.is_active = true
    )
);

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
