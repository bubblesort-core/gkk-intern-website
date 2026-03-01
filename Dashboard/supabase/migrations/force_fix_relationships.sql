-- Force fix relationships to point to public.profiles instead of auth.users
-- This is necessary because the JS client cannot join auth.users directly due to security restrictions.

-- 1. TICKETS TABLE
ALTER TABLE "public"."tickets" DROP CONSTRAINT IF EXISTS "tickets_user_id_fkey";
ALTER TABLE "public"."tickets" DROP CONSTRAINT IF EXISTS "tickets_assigned_to_fkey";

-- Re-add pointing to PROFILES
ALTER TABLE "public"."tickets" 
    ADD CONSTRAINT "tickets_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "public"."profiles" ("id") 
    ON DELETE CASCADE;

ALTER TABLE "public"."tickets" 
    ADD CONSTRAINT "tickets_assigned_to_fkey" 
    FOREIGN KEY ("assigned_to") 
    REFERENCES "public"."profiles" ("id") 
    ON DELETE SET NULL;


-- 2. TICKET_MESSAGES TABLE
ALTER TABLE "public"."ticket_messages" DROP CONSTRAINT IF EXISTS "ticket_messages_sender_id_fkey";

-- Re-add pointing to PROFILES
ALTER TABLE "public"."ticket_messages" 
    ADD CONSTRAINT "ticket_messages_sender_id_fkey" 
    FOREIGN KEY ("sender_id") 
    REFERENCES "public"."profiles" ("id") 
    ON DELETE CASCADE;

-- 3. Reload Schema Cache
-- This ensures PostgREST picks up the new relationships immediately.
NOTIFY pgrst, 'reload config';
