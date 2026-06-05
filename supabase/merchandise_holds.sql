-- 1. Create the holds table
CREATE TABLE IF NOT EXISTS public.merchandise_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.merchandise_products(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup of active holds
CREATE INDEX IF NOT EXISTS idx_merch_holds_active ON public.merchandise_holds (product_id, expires_at);

-- 2. Create the Atomic Hold RPC Function (handles the millisecond race condition)
CREATE OR REPLACE FUNCTION create_merchandise_hold(p_product_id UUID, p_session_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_stock_count INT;
  v_active_holds INT;
  v_hold_id UUID;
BEGIN
  -- Lock the row for this transaction so no one else can read/write the stock concurrently
  SELECT stock_count INTO v_stock_count 
  FROM public.merchandise_products 
  WHERE id = p_product_id 
  FOR UPDATE;

  -- If stock_count is NULL, it means unlimited stock, so we don't need a hold, but we can return a dummy ID
  IF v_stock_count IS NULL THEN
     RETURN gen_random_uuid();
  END IF;

  -- Delete existing holds for this session and product to prevent duplicate holds from the same user
  DELETE FROM public.merchandise_holds
  WHERE product_id = p_product_id AND session_id = p_session_id;

  -- Count currently active holds
  SELECT count(*) INTO v_active_holds 
  FROM public.merchandise_holds 
  WHERE product_id = p_product_id AND expires_at > now();

  -- We strictly reserve and block ONLY when 1 item is left.
  -- If stock > 1, we allow anyone to enter the buy phase and get a timer.
  -- If stock == 1, we only allow if there are no active holds.
  IF v_stock_count > 1 OR (v_stock_count = 1 AND v_active_holds = 0) THEN
    INSERT INTO public.merchandise_holds (product_id, session_id, expires_at) 
    VALUES (p_product_id, p_session_id, now() + interval '5 minutes')
    RETURNING id INTO v_hold_id;
    
    RETURN v_hold_id;
  ELSE
    RAISE EXCEPTION 'Product is out of stock or completely held by other customers.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RPC to explicitly release a hold early (e.g. user closes tab)
CREATE OR REPLACE FUNCTION release_merchandise_hold(p_hold_id UUID, p_session_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM public.merchandise_holds 
  WHERE id = p_hold_id AND session_id = p_session_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create RPC to finalize purchase (Deduct stock and delete hold)
CREATE OR REPLACE FUNCTION finalize_merchandise_purchase(p_hold_id UUID, p_product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_hold_exists BOOLEAN;
BEGIN
  -- Check if the hold still exists and is somewhat valid (or we can just ignore expiry if they already paid)
  -- If p_hold_id is null or a dummy, it might be an unlimited stock product.
  IF p_hold_id IS NOT NULL THEN
     DELETE FROM public.merchandise_holds WHERE id = p_hold_id;
  END IF;

  -- Decrement stock safely
  UPDATE public.merchandise_products 
  SET stock_count = stock_count - 1 
  WHERE id = p_product_id AND stock_count > 0;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create RPC to get effective stock quickly for polling
CREATE OR REPLACE FUNCTION get_effective_stock(p_product_id UUID)
RETURNS INT AS $$
DECLARE
  v_stock_count INT;
  v_active_holds INT;
BEGIN
  SELECT stock_count INTO v_stock_count FROM public.merchandise_products WHERE id = p_product_id;
  
  IF v_stock_count IS NULL THEN
    RETURN 999999; -- Represents unlimited
  END IF;

  SELECT count(*) INTO v_active_holds 
  FROM public.merchandise_holds 
  WHERE product_id = p_product_id AND expires_at > now();

  RETURN GREATEST(0, v_stock_count - v_active_holds);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create RPC to get all effective stocks quickly for polling on the main merchandise page
CREATE OR REPLACE FUNCTION get_all_effective_stock()
RETURNS TABLE (product_id UUID, effective_stock INT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    CASE 
      WHEN p.stock_count IS NULL THEN 999999
      ELSE GREATEST(0, p.stock_count - COALESCE(
        (SELECT count(*)::INT FROM public.merchandise_holds h 
         WHERE h.product_id = p.id AND h.expires_at > now()), 0))
    END::INT as effective_stock
  FROM public.merchandise_products p
  WHERE p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
