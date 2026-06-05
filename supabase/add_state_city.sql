ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS city text;
