import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
        // Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { applicationId, email } = await req.json()

        if (!applicationId && !email) {
            throw new Error('Must provide applicationId or email')
        }

        const results = {
            applicationDeleted: false,
            profileDeleted: false,
            authUserDeleted: false,
            errors: [] as string[]
        }

        // 1. Delete Application Record (if ID provided)
        if (applicationId) {
            const { error: appError } = await supabaseAdmin
                .from('applications')
                .delete()
                .eq('id', applicationId)

            if (appError) {
                console.error('Error deleting application:', appError)
                results.errors.push(`App Delete Error: ${appError.message}`)
            } else {
                results.applicationDeleted = true
            }
        }

        // 2. Delete Auth User & Profile (if email provided)
        if (email) {
            // Step A: Resolve Email -> User ID via Profiles table OR Direct Auth Lookup
            let userId = null;

            // Try Profiles first
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle()

            if (profile && profile.id) {
                userId = profile.id;
            } else {
                // Fallback: Try to find user directly in Auth via RPC
                // Note: You must create this RPC function in your database first!
                const { data: authUserId, error: rpcError } = await supabaseAdmin
                    .rpc('get_user_id_by_email', { email_input: email })

                if (authUserId) {
                    userId = authUserId;
                } else if (rpcError) {
                    console.error('RPC Error:', rpcError)
                    results.errors.push(`RPC Lookup Error: ${rpcError.message}`)
                }
            }

            if (userId) {
                // Step B: Delete from Auth
                const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

                if (authError) {
                    console.error('Error deleting auth user:', authError)
                    results.errors.push(`Auth Delete Error: ${authError.message}`)

                    // Fallback: Try to at least delete the profile record if Auth failed matches ID
                    const { error: profError } = await supabaseAdmin
                        .from('profiles')
                        .delete()
                        .eq('id', userId)

                    if (!profError) results.profileDeleted = true

                } else {
                    results.authUserDeleted = true
                    results.profileDeleted = true // Implicitly deleted or cascaded
                }
            } else {
                results.errors.push('User not found in profiles or auth system (User might not be registered)')
            }
        }

        return new Response(
            JSON.stringify(results),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
