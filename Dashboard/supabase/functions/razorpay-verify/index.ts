import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

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
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = await req.json()

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error('Missing payment details');
        }

        // 1. Verify Signature
        const generated_signature = createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            console.error('Signature Mismatch');
            throw new Error('Invalid payment signature')
        }

        console.log('Signature Verified. Updating Database...');

        // 2. Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // 3. Update Payment Status
        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .update({
                razorpay_payment_id,
                razorpay_signature,
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', razorpay_order_id)
            .select()
            .single()

        if (paymentError) {
            // If payment row missing (e.g. order function failed to insert), try to find by order_id or handle error
            console.error('Error updating payment:', paymentError);
            throw new Error('Could not update payment record');
        }

        // 4. Activate User Profile
        if (payment?.user_id) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ status: 'active' })
                .eq('id', payment.user_id);

            if (profileError) {
                console.error('Error activating profile:', profileError);
                throw new Error('Payment verified but profile activation failed');
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Verification Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
