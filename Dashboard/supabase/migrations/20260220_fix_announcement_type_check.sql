-- Fix announcement type constraint to match Admin UI values
DO $$
BEGIN
    -- Drop the constraint if it exists (using a slightly generic name just in case, or specific if known)
    ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_type_check;
    
    -- Re-add with supported values
    ALTER TABLE public.announcements 
    ADD CONSTRAINT announcements_type_check 
    CHECK (type IN ('info', 'success', 'warning', 'alert', 'error')); 
    -- Added 'error' just in case legacy data uses it, but UI sends 'alert'
END $$;
