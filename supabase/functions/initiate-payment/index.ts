import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const allowedOrigins = [
    'https://gkkintern.site',
    'https://www.gkkintern.site',
    'http://localhost:5173',
    'http://localhost:3000'
];

const corsHeaders = (origin: string | null) => ({
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin! : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
});

serve(async (req) => {
    const origin = req.headers.get('origin');

    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders(origin) })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { studentName, email, phone, userId } = await req.json()

        if (!studentName || !email || !phone) {
            throw new Error('Missing student details')
        }

        // Initialize Razorpay Order
        const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
        const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''

        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            throw new Error('Server misconfiguration: Missing Razorpay keys')
        }

        // Create Order via Razorpay API
        const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
        const razorpayResp = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 100, // 1 INR in paise
                currency: 'INR',
                receipt: `rcpt_${Date.now()}_${userId.slice(0, 5)}`,
                notes: {
                    user_id: userId,
                    email: email
                }
            })
        })

        if (!razorpayResp.ok) {
            const err = await razorpayResp.text()
            console.error('Razorpay Order Creation Failed:', err)
            throw new Error('Failed to create payment order')
        }

        const order = await razorpayResp.json()

        // Insert into payments table
        const { data: paymentData, error: dbError } = await supabase
            .from('payments')
            .insert({
                user_id: userId,
                amount: 1.00,
                status: 'pending',
                currency: 'INR',
                razorpay_order_id: order.id,
                customer_name: studentName,
                customer_email: email,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB Insert Error:', dbError)
            throw new Error('Failed to record payment intent')
        }

        return new Response(
            JSON.stringify({
                orderId: order.id,
                amount: 1,
                currency: 'INR',
                key: RAZORPAY_KEY_ID,
                // Backward compatibility if needed, or update frontend to use Razorpay Checkout
                // The frontend 'payment.js' expects 'enrollmentId' to poll?
                // We'll return orderId as enrollmentId if we want to trick it, 
                // but better to return standard Razorpay params.
                enrollmentId: paymentData.id, // for our own internal tracking
                razorpayOrderId: order.id
            }),
            { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
        )
    }
})
