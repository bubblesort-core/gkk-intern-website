-- Insert or update the maintenance mode settings
INSERT INTO public.system_config (key, value)
VALUES (
    'maintenance_mode',
    '{"enabled": false, "template": "default", "title": "Scheduled Maintenance", "message": "We are currently undergoing scheduled maintenance to improve the platform. Please check back soon."}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Ensure public read access is enabled on system_config
-- so the unauthenticated frontend can read the maintenance_mode flag
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Drop policy if it already exists to avoid errors
DROP POLICY IF EXISTS "Allow public read access on system_config" ON public.system_config;

-- Create policy for public read access
CREATE POLICY "Allow public read access on system_config"
    ON public.system_config
    FOR SELECT
    USING (true);

-- Allow authenticated users to manage system_config (Admins only in practice)
DROP POLICY IF EXISTS "Allow authenticated full access on system_config" ON public.system_config;

CREATE POLICY "Allow authenticated full access on system_config"
    ON public.system_config
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
