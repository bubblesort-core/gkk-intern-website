-- ==============================================================================
-- SECURITY FIX: Payment RLS (Idempotent Version)
-- ==============================================================================

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 1. DROP EXISTING POLICIES (To avoid "policy already exists" errors)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- 2. CREATE POLICIES

-- Policy 1: Users can view THEIR OWN payment records
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Policy 2: Admins can view ALL payments
CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
USING (
  public.is_admin_user()
);
