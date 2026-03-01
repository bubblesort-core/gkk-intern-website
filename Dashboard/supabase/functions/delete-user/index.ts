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
            // Step A: Resolve Email -> User ID via Profiles table
            // We do this because Admin API doesn't easily "delete by email", it needs UUID.
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle()

            if (profile && profile.id) {
                // Step B: Delete from Auth (this usually cascades to profiles if set up, 
                // but we can also manually delete profile just in case cascade isn't on)

                const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(profile.id)

                if (authError) {
                    console.error('Error deleting auth user:', authError)
                    results.errors.push(`Auth Delete Error: ${authError.message}`)

                    // Fallback: Try to at least delete the profile record if Auth failed
                    const { error: profError } = await supabaseAdmin
                        .from('profiles')
                        .delete()
                        .eq('id', profile.id)

                    if (!profError) results.profileDeleted = true

                } else {
                    results.authUserDeleted = true
                    results.profileDeleted = true // Implicitly deleted or cascaded
                }
            } else {
                // User not found in profiles check if they exist in auth only?
                // Hard to check Auth by email efficiently without listUsers loop. 
                // For now, we assume if no profile, they strictly haven't onboarded fully.
                results.errors.push('User not found in profiles (User might not be registered yet)')
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
