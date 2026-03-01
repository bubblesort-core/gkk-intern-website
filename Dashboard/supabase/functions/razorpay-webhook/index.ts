import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

            // Extract email from payment notes or description
            // Razorpay payment button should include user email in notes
            const userEmail = payment.notes?.email || payment.email

            if (!userEmail) {
                console.error('No user email found in payment data')
                return new Response(
                    JSON.stringify({ error: 'User email not found' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            console.log(`Processing payment for user: ${userEmail}`)

            // 1. Get user profile to get UUID
            const { data: userProfile, error: userFetchError } = await supabase
                .from('profiles')
                .select('id, status')
                .eq('email', userEmail.toLowerCase())
                .single()

            if (userFetchError || !userProfile) {
                console.error('User profile not found for email:', userEmail)
                return new Response(
                    JSON.stringify({ error: 'User profile not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            // 2. Record in existing 'payments' table (Update by razorpay_order_id)
            if (payment.order_id) {
                // We use upsert=false to just update, but since we want to be robust:
                // First try to Update the existing pending record
                const { data: updatedPayment, error: updateError } = await supabase
                    .from('payments')
                    .update({
                        amount: payment.amount / 100, // Convert paise to rupees
                        razorpay_payment_id: payment.id,
                        currency: payment.currency,
                        status: 'captured',
                        payment_method: payment.method,
                        completed_at: new Date().toISOString()
                    })
                    .eq('razorpay_order_id', payment.order_id)
                    .select()
                    .single()

                if (updateError || !updatedPayment) {
                    console.log('Update failed or no record found. Attempting insert as fallback.')
                    // Fallback: If no record found to update (rare), insert new
                    const { error: insertError } = await supabase
                        .from('payments')
                        .insert({
                            user_id: userProfile.id,
                            amount: payment.amount / 100,
                            razorpay_payment_id: payment.id,
                            razorpay_order_id: payment.order_id,
                            currency: payment.currency,
                            status: 'captured',
                            payment_method: payment.method,
                            completed_at: new Date().toISOString()
                        })

                    if (insertError) {
                        console.error('Error inserting payment fallback:', insertError)
                    }
                }
            } else {
                console.warn('Missing order_id on payment. Skipping payments table update.')
            }

            // 3. Update user profile to 'active'
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

            console.log(`User ${userEmail} activated successfully`)

            // 4. Trigger Referral Reward (Instant Unlock)
            // Now that payment is done, we check if this user was referred and reward the referrer
            const { error: referralError } = await supabase.rpc('complete_referral_reward', {
                user_id_input: userProfile.id
            })

            if (referralError) {
                console.error('Error triggering referral reward:', referralError)
                // We don't fail the request because payment succeeded, just log it
            } else {
                console.log('Referral reward process triggered')
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Payment processed and user activated',
                    profile: updatedProfile
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
