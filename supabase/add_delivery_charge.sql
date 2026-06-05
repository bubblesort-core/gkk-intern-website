ALTER TABLE public.merchandise_products 
ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_charge_type TEXT DEFAULT 'included';
