-- Create the merchandise storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'merchandise', 
    'merchandise', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'merchandise');

-- Grant admins insert/upload access
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'merchandise' 
    AND auth.uid() IN (SELECT id FROM public.admins)
);

-- Grant admins update access
CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'merchandise' 
    AND auth.uid() IN (SELECT id FROM public.admins)
);

-- Grant admins delete access
CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'merchandise' 
    AND auth.uid() IN (SELECT id FROM public.admins)
);
