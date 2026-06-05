import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders, status: 204 })
    }

    try {
        const { product_id, session_id } = await req.json()

        if (!product_id || !session_id) {
            throw new Error("Missing product_id or session_id")
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Call our highly atomic RPC function to lock the row and create the hold
        const { data: hold_id, error } = await supabaseAdmin.rpc('create_merchandise_hold', {
            p_product_id: product_id,
            p_session_id: session_id
        })

        if (error) {
            console.error('Failed to create hold:', error);
            throw new Error(error.message || 'Product is out of stock or reserved.')
        }

        return new Response(JSON.stringify({ hold_id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
