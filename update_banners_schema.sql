-- Add customization columns to the banners table
ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'top',
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#34d399',
ADD COLUMN IF NOT EXISTS button_text TEXT,
ADD COLUMN IF NOT EXISTS button_link TEXT;
