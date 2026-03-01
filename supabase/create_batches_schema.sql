-- 1. Create Table (if not exists)
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modify Columns (to match new requirements if table already exists)
-- Remove dates if they exist (safe to ignore if not present)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'batches' AND column_name = 'start_date') THEN
        ALTER TABLE public.batches DROP COLUMN start_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'batches' AND column_name = 'end_date') THEN
        ALTER TABLE public.batches DROP COLUMN end_date;
    END IF;
END $$;

-- Add description if it doesn't exist
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add Batch ID to Teams
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;
DROP POLICY IF EXISTS "Everyone can view active batches" ON public.batches;

-- 6. Recreate Policies with Correct Logic
CREATE POLICY "Admins can manage batches" 
ON public.batches
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.admin_credentials 
        WHERE id = auth.uid()
    )
    OR 
    (auth.jwt() ->> 'email') = 'noreplay.gkk26@gmail.com'
    OR
    auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Everyone can view active batches"
ON public.batches
FOR SELECT
TO authenticated
USING (true);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_teams_batch_id ON public.teams(batch_id);
