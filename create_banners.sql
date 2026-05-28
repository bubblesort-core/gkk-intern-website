CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Enable all access for admins" ON public.banners FOR ALL USING (auth.uid() IN (SELECT id FROM public.admins));
