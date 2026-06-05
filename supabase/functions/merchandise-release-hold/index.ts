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
        const { hold_id, session_id } = await req.json()

        if (!hold_id || !session_id) {
            throw new Error("Missing hold_id or session_id")
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Call our RPC to release the hold early
        const { data: success, error } = await supabaseAdmin.rpc('release_merchandise_hold', {
            p_hold_id: hold_id,
            p_session_id: session_id
        })

        if (error) {
            console.error('Failed to release hold:', error);
            throw new Error(error.message)
        }

        return new Response(JSON.stringify({ success }), {
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
