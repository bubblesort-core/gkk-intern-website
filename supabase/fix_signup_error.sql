-- ==============================================================================
-- FINAL FIX SCRIPT (Referrals + Safe Mode)
-- ==============================================================================

-- 1. DROP BLOCKING TRIGGERS
DROP TRIGGER IF EXISTS ensure_application_approved ON auth.users;
DROP FUNCTION IF EXISTS public.check_application_whitelist();

-- 2. ROBUST PROFILE CREATION (SAFE MODE + REFERRALS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ref_id UUID := NULL;
  initial_xp INTEGER := 0;
  valid_referrer BOOLEAN := FALSE;
BEGIN
  -- A. TRY TO EXTRACT REFERRAL
  -- We wrap this in a block so if it fails, it doesn't stop profile creation
  BEGIN
    ref_id := (NEW.raw_user_meta_data->>'referrer_id')::UUID;
    
    -- Check if referrer exists
    IF ref_id IS NOT NULL THEN
       SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = ref_id) INTO valid_referrer;
       IF valid_referrer THEN
          initial_xp := 50;
       ELSE
          ref_id := NULL; -- Invalid referrer, ignore it
       END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If anything goes wrong with referral logic, just ignore it and proceed
    ref_id := NULL;
    initial_xp := 0;
  END;

  -- B. INSERT PROFILE (CRITICAL STEP)
  -- We rely on defaults for 'status', 'role', etc. to avoid errors.
  -- We use COALESCE to ensure full_name is never null.
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, referred_by, xp)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      NOW(), 
      ref_id, 
      initial_xp
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email; -- Just ensure data is fresh
  EXCEPTION WHEN OTHERS THEN
     -- IF profile insertion fails, we log it but do NOT raise error.
     -- This allows auth.users creation to succeed so User can at least log in.
     -- We can fix missing profiles later if needed.
     RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;
  
  -- C. TRACK REFERRAL (OPTIONAL STEP)
  BEGIN
    IF ref_id IS NOT NULL THEN
       INSERT INTO public.referral_tracking (referrer_id, referred_user_id, status)
       VALUES (ref_id, NEW.id, 'pending')
       ON CONFLICT (referred_user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Referral tracking failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ENSURE POLICIES EXIST (BUT DON'T FAIL IF THEY DO)
-- We'll use 'DO' blocks to check before creating to avoid "policy already exists" errors in some SQL editors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for own profile') THEN
        CREATE POLICY "Enable read access for own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for own profile') THEN
        CREATE POLICY "Enable update for own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 4. ENSURE REFERRAL CODE GEN TRIGGER
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
    clean_name TEXT;
    rnd_code TEXT;
    final_code TEXT;
    exists_check BOOLEAN;
BEGIN
    IF NEW.referral_code IS NULL THEN
        -- Wrap in COALESCE to never fail
        clean_name := REPLACE(INITCAP(SPLIT_PART(COALESCE(NEW.full_name, 'Intern'), ' ', 1)), ' ', '');
        IF clean_name IS NULL OR clean_name = '' THEN clean_name := 'Intern'; END IF;
        
        LOOP
            rnd_code := FLOOR(10000 + RANDOM() * 89999)::TEXT;
            final_code := 'GKK' || clean_name || rnd_code;
            SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = final_code) INTO exists_check;
            IF NOT exists_check THEN
                NEW.referral_code := final_code;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gen_referral_code ON profiles;
CREATE TRIGGER trigger_gen_referral_code
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();
