-- Allow users to update their own profile (crucial for FCM token saving from the Flutter App)
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Force schema reload
NOTIFY pgrst, 'reload config';
