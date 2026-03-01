import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Environment variables
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_id, application_id, email, phone, full_name } = await req.json()

        console.log(`Creating order for user ${user_id}`);

        // Create Razorpay order
        // Amount is in paise (10000 = ₹100)
        const orderData = {
            amount: 50929, // ₹509.29 → after Razorpay 2% fee, company receives ₹499.10
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${user_id.slice(0, 8)}`,
            notes: {
                user_id,
                application_id,
                purpose: 'internship_enrollment'
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

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Save initial payment record
        const { error: insertError } = await supabaseAdmin.from('payments').insert({
            user_id,
            application_id,
            razorpay_order_id: order.id,
            amount: 509.29,
            status: 'pending',
            currency: 'INR'
        })

        if (insertError) {
            console.error('Database Insert Error:', insertError);
            // Note: We still return the order to the user so they can pay, 
            // verification step will fix/create record if missing, but logging is good.
        }

        return new Response(JSON.stringify({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: RAZORPAY_KEY_ID, // Send key back to client for convenience
            prefill: {
                name: full_name,
                email: email,
                contact: phone
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
