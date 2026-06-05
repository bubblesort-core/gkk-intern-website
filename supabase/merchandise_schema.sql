-- Settings Table
CREATE TABLE IF NOT EXISTS public.merchandise_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_store_open BOOLEAN DEFAULT true,
    lock_message TEXT DEFAULT 'The store is currently closed. Please check back later.',
    banner_type TEXT DEFAULT 'none',
    banner_message TEXT,
    layout_config JSONB DEFAULT '{"sections": ["gallery", "details", "reviews"]}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initialize settings
INSERT INTO public.merchandise_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Products Table
CREATE TABLE IF NOT EXISTS public.merchandise_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    features JSONB DEFAULT '[]', 
    custom_fields JSONB DEFAULT '[]', 
    price NUMERIC NOT NULL,
    compare_at_price NUMERIC,
    delivery_charge NUMERIC DEFAULT 0,
    delivery_charge_type TEXT DEFAULT 'included',
    expected_delivery TEXT,
    images JSONB DEFAULT '[]', 
    stock_count INT DEFAULT NULL,
    stock_refill_note TEXT,
    stock_status TEXT DEFAULT 'in_stock',
    payment_service TEXT DEFAULT 'razorpay',
    payment_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.merchandise_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.merchandise_products(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchandise_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchandise_reviews ENABLE ROW LEVEL SECURITY;

-- Settings Policies
DROP POLICY IF EXISTS "Public read access for settings" ON public.merchandise_settings;
CREATE POLICY "Public read access for settings" ON public.merchandise_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for settings" ON public.merchandise_settings;
CREATE POLICY "Admin full access for settings" ON public.merchandise_settings USING (auth.uid() IN (SELECT id FROM public.admins));

-- Products Policies
DROP POLICY IF EXISTS "Public read access for active products" ON public.merchandise_products;
CREATE POLICY "Public read access for active products" ON public.merchandise_products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access for products" ON public.merchandise_products;
CREATE POLICY "Admin full access for products" ON public.merchandise_products USING (auth.uid() IN (SELECT id FROM public.admins));

-- Reviews Policies
DROP POLICY IF EXISTS "Public read access for approved reviews" ON public.merchandise_reviews;
CREATE POLICY "Public read access for approved reviews" ON public.merchandise_reviews FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Public can insert reviews" ON public.merchandise_reviews;
CREATE POLICY "Public can insert reviews" ON public.merchandise_reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for reviews" ON public.merchandise_reviews;
CREATE POLICY "Admin full access for reviews" ON public.merchandise_reviews USING (auth.uid() IN (SELECT id FROM public.admins));

-- Orders Table
CREATE TABLE IF NOT EXISTS public.merchandise_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.merchandise_products(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    phone_number TEXT,
    delivery_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    shipping_status TEXT DEFAULT 'Processing',
    tracking_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- Enable RLS for Orders
ALTER TABLE public.merchandise_orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies
DROP POLICY IF EXISTS "Public can insert orders" ON public.merchandise_orders;
CREATE POLICY "Public can insert orders" ON public.merchandise_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for orders" ON public.merchandise_orders;
CREATE POLICY "Admin full access for orders" ON public.merchandise_orders USING (auth.uid() IN (SELECT id FROM public.admins));

-- Secure Order Tracking Function for Guests
CREATE OR REPLACE FUNCTION get_order_tracking(p_order_id TEXT, p_email TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT row_to_json(o) INTO result
    FROM public.merchandise_orders o
    WHERE razorpay_order_id = p_order_id AND user_email = p_email;
    
    RETURN result;
END;
$$;
