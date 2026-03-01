-- ==========================================
-- GKK-HIRE MESSAGE VISIBILITY FIX
-- ==========================================

-- Problem: Admins couldn't see their own sent messages.
-- Fix: Explicitly allow any user (Admin or Intern) to seeing messages *they sent*.

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Senders can view their own messages
DROP POLICY IF EXISTS "Senders can view their own messages" ON public.ticket_messages;

CREATE POLICY "Senders can view their own messages"
ON public.ticket_messages FOR SELECT
USING ( auth.uid() = sender_id );

-- 2. Ensure Realtime is enabled (Safely)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'ticket_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
    END IF;
END $$;
