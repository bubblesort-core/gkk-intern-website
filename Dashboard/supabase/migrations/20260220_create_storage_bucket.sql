
-- Insert the resources bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public Read Access (Specific to resources bucket)
DROP POLICY IF EXISTS "Public Access Resources" ON storage.objects;
CREATE POLICY "Public Access Resources"
ON storage.objects FOR SELECT
USING ( bucket_id = 'resources' );

-- Policy: Admin Upload (Specific to resources bucket)
DROP POLICY IF EXISTS "Authenticated Upload Resources" ON storage.objects;
CREATE POLICY "Authenticated Upload Resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'resources' );

-- Policy: Admin Update (Specific to resources bucket)
DROP POLICY IF EXISTS "Authenticated Update Resources" ON storage.objects;
CREATE POLICY "Authenticated Update Resources"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'resources' );

-- Policy: Admin Delete (Specific to resources bucket)
DROP POLICY IF EXISTS "Authenticated Delete Resources" ON storage.objects;
CREATE POLICY "Authenticated Delete Resources"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'resources' );
