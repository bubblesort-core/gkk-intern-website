-- Add new columns to profiles table for Intern Profile page
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Intern',
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.profiles.bio IS 'Short biography of the intern';
COMMENT ON COLUMN public.profiles.role IS 'Role/Title of the intern (e.g. Frontend Developer)';
COMMENT ON COLUMN public.profiles.projects IS 'List of projects with title, description, and link';

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
