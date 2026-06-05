// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { product_id, hold_id, user_email, user_name, user_phone, delivery_address, city, state, zip_code } = await req.json()

        if (!product_id || !hold_id) {
            throw new Error("Missing product_id or hold_id")
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Fetch product price dynamically to prevent client-side tampering
        const { data: product, error: fetchError } = await supabaseAdmin
            .from('merchandise_products')
            .select('price, delivery_charge, delivery_charge_type, name')
            .eq('id', product_id)
            .single()

        if (fetchError || !product) {
            throw new Error('Product not found')
        }

        const basePrice = parseFloat(product.price);
        const deliveryCharge = product.delivery_charge ? parseFloat(product.delivery_charge) : 0;
        const totalAmount = basePrice + deliveryCharge;
        const priceInPaise = Math.round(totalAmount * 100);

        // Create Razorpay order
        const orderData = {
            amount: priceInPaise,
            currency: 'INR',
            receipt: `rcpt_merch_${Date.now()}_${product_id.slice(0, 8)}`,
            notes: {
                product_id,
                product_name: product.name,
                user_email,
                user_phone
            }
        }

        const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })

        const order = await response.json()

        if (!response.ok) {
            console.error('Razorpay Error:', order);
            throw new Error(order.error?.description || 'Failed to create Razorpay order')
        }

        // Save order to merchandise_orders table
        const { error: insertError } = await supabaseAdmin.from('merchandise_orders').insert({
            product_id,
            user_email,
            user_name,
            phone_number: user_phone,
            delivery_address,
            city,
            state,
            zip_code,
            razorpay_order_id: order.id,
            amount: totalAmount,
            currency: 'INR',
            status: 'pending'
        })

        if (insertError) {
            console.error('Database Insert Error:', insertError);
        }

        return new Response(JSON.stringify({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: RAZORPAY_KEY_ID, 
            prefill: {
                name: user_name || '',
                email: user_email || '',
                contact: user_phone || ''
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
