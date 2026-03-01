import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

// CORS for webhook - Razorpay webhooks come from their servers
// We keep * for webhooks since Razorpay calls this, but we verify via signature
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get Razorpay webhook secret from environment
        const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
        if (!RAZORPAY_WEBHOOK_SECRET) {
            throw new Error('Razorpay webhook secret not configured')
        }

        // Get the raw body for signature verification
        const body = await req.text()
        const signature = req.headers.get('x-razorpay-signature')

        if (!signature) {
            return new Response(
                JSON.stringify({ error: 'Missing signature' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Verify webhook signature
        const isValid = await verifyWebhookSignature(body, signature, RAZORPAY_WEBHOOK_SECRET)
        if (!isValid) {
            console.error('Invalid webhook signature')
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse the verified payload
        const event = JSON.parse(body)
        console.log('Razorpay webhook event:', event.event)

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Handle payment.captured event
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity
            const orderId = payment.order_id || null

            if (!orderId) {
                console.warn('Missing order_id on payment. Proceeding without payment record update.')
            }

            // Try resolve user from payments table using order_id (most reliable)
            const { data: paymentRecord, error: paymentFetchError } = orderId
                ? await supabase
                    .from('payments')
                    .select('user_id, customer_email, customer_name')
                    .eq('razorpay_order_id', orderId)
                    .maybeSingle()
                : { data: null, error: null }

            if (paymentFetchError) {
                console.error('Error fetching payment record:', paymentFetchError)
            }

            const userEmail = (paymentRecord?.customer_email || payment.notes?.email || payment.email || '').toLowerCase()
            const userId = paymentRecord?.user_id || payment.notes?.user_id || null

            if (!userEmail && !userId) {
                console.error('No user identifier found in payment data')
                return new Response(
                    JSON.stringify({ error: 'User identifier not found' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            console.log(`Processing payment for user: ${userId || userEmail}`)

            // 1. Get user profile to get UUID and Name
            const profileQuery = supabase
                .from('profiles')
                .select('id, status, full_name, email')

            const { data: userProfile, error: userFetchError } = userId
                ? await profileQuery.eq('id', userId).single()
                : await profileQuery.eq('email', userEmail).single()

            if (userFetchError || !userProfile) {
                console.error('User profile not found for:', userId || userEmail)
                return new Response(
                    JSON.stringify({ error: 'User profile not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // 2. Record in existing 'payments' table (Update by razorpay_order_id)
            if (orderId) {
                const { data: updatedPayment, error: updateError } = await supabase
                    .from('payments')
                    .update({
                        amount: payment.amount / 100, // Convert paise to rupees
                        razorpay_payment_id: payment.id,
                        currency: payment.currency,
                        status: 'captured',
                        payment_method: payment.method,
                        completed_at: new Date().toISOString(),
                        customer_email: userProfile.email || userEmail,
                        customer_name: userProfile.full_name || paymentRecord?.customer_name || null
                    })
                    .eq('razorpay_order_id', orderId)
                    .select()
                    .maybeSingle()

                if (updateError || !updatedPayment) {
                    console.log('Update failed or no record found. Attempting insert as fallback.')
                    const { error: insertError } = await supabase
                        .from('payments')
                        .insert({
                            user_id: userProfile.id,
                            amount: payment.amount / 100,
                            razorpay_payment_id: payment.id,
                            razorpay_order_id: orderId,
                            currency: payment.currency,
                            status: 'captured',
                            payment_method: payment.method,
                            completed_at: new Date().toISOString(),
                            customer_email: userProfile.email || userEmail,
                            customer_name: userProfile.full_name || paymentRecord?.customer_name || null
                        })

                    if (insertError) {
                        console.error('Error inserting payment fallback:', insertError)
                    }
                }
            }

            // 3. Update user profile to 'active' (block only rejected)
            const normalizedStatus = (userProfile.status || '').toLowerCase().trim()
            if (normalizedStatus === 'rejected') {
                console.warn(`User ${userProfile.id} rejected. Current status: ${userProfile.status}`)
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Payment captured, but user is rejected'
                    }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const { data: updatedProfile, error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ status: 'active' })
                .eq('id', userProfile.id)
                .select()
                .single()

            if (profileUpdateError) {
                console.error('Error updating profile:', profileUpdateError)
                return new Response(
                    JSON.stringify({ error: 'Failed to activate user' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            console.log(`User ${userProfile.email} activated successfully`)

            // Return minimal response - don't expose user data
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Payment processed and user activated'
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Handle other events (optional)
        return new Response(
            JSON.stringify({ success: true, message: 'Event received' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

// Verify Razorpay webhook signature
async function verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
): Promise<boolean> {
    try {
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        )

        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(body)
        )

        const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

        return expectedSignature === signature
    } catch (error) {
        console.error('Signature verification error:', error)
        return false
    }
}
