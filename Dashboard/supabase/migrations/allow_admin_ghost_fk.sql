-- Allow Admins (who are not in profiles) to be assigned tickets and send messages.
-- Reverts the previous "force_fix" which required everyone to be in public.profiles.

-- 1. TICKETS: assigned_to -> auth.users
ALTER TABLE "public"."tickets" DROP CONSTRAINT IF EXISTS "tickets_assigned_to_fkey";

ALTER TABLE "public"."tickets" 
    ADD CONSTRAINT "tickets_assigned_to_fkey" 
    FOREIGN KEY ("assigned_to") 
    REFERENCES "auth"."users" ("id") 
    ON DELETE SET NULL;

-- 2. MESSAGES: sender_id -> auth.users
ALTER TABLE "public"."ticket_messages" DROP CONSTRAINT IF EXISTS "ticket_messages_sender_id_fkey";

ALTER TABLE "public"."ticket_messages" 
    ADD CONSTRAINT "ticket_messages_sender_id_fkey" 
    FOREIGN KEY ("sender_id") 
    REFERENCES "auth"."users" ("id") 
    ON DELETE CASCADE;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
