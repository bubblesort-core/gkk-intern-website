-- FINAL ADMIN RLS FIX
-- Grants access to the specific admin email: admingkk2026@gmail.com

-- 1. Allow Login Check (Public Read)
DROP POLICY IF EXISTS "Public view admin_credentials" ON admin_credentials;
CREATE POLICY "Public view admin_credentials" 
ON admin_credentials FOR SELECT 
USING (true);

-- 2. Grant Access to Profiles
DROP POLICY IF EXISTS "Admin view all profiles" ON profiles;
CREATE POLICY "Admin view all profiles" 
ON profiles FOR SELECT 
USING (auth.email() = 'noreplay.gkk26@gmail.com');

-- 3. Grant Access to Payments
DROP POLICY IF EXISTS "Admin view all payments" ON payments;
CREATE POLICY "Admin view all payments" 
ON payments FOR SELECT 
USING (auth.email() = 'noreplay.gkk26@gmail.com');

-- 4. Grant Access to Applications
DROP POLICY IF EXISTS "Admin view all applications" ON applications;
CREATE POLICY "Admin view all applications" 
ON applications FOR SELECT 
USING (auth.email() = 'noreplay.gkk26@gmail.com');
