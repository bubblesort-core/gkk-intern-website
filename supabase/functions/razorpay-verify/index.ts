import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
        const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!

        // Verify signature
        const generated_signature = await hmacSha256(razorpay_order_id + "|" + razorpay_payment_id, secret);

        if (generated_signature !== razorpay_signature) {
            throw new Error("Invalid signature");
        }

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Update payment status
        const { data: payment, error: updateError } = await supabaseAdmin
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

        if (updateError) throw updateError

        // CRITICAL: Update user profile status to 'active' to unlock dashboard
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', payment.user_id);

        if (profileError) {
            console.error("Failed to update profile status:", profileError);
            // We don't throw here to avoid failing the payment verification response,
            // but this requires manual intervention or a retry mechanism.
        }

        return new Response(JSON.stringify({ success: true, payment }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

async function hmacSha256(message: string, secret: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
