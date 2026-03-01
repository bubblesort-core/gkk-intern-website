import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(serviceAccount: any) {
    const privateKey = await importPKCS8(serviceAccount.private_key, "RS256");
    const jwt = await new SignJWT({
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: "https://oauth2.googleapis.com/token",
        scope: "https://www.googleapis.com/auth/firebase.messaging"
    })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(privateKey);

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Failed to get access token: " + data.error_description);
    return data.access_token;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { title, body, targetType, targetIds } = await req.json()

        if (!title || !body) {
            throw new Error('Missing required fields: title, body')
        }

        // Get FCM Service Account from env
        const serviceAccountStr = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')
        if (!serviceAccountStr) {
            throw new Error('FCM_SERVICE_ACCOUNT_JSON not configured.')
        }

        const serviceAccount = JSON.parse(serviceAccountStr)
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        // Initialize Supabase client to fetch FCM tokens
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // ─── Resolve targetIds → user IDs based on targetType ───
        let userIds: string[] = [];

        if (targetType === 'interns' && targetIds?.length > 0) {
            // targetIds are already user UUIDs
            userIds = targetIds;

        } else if (targetType === 'teams' && targetIds?.length > 0) {
            // targetIds are team UUIDs → resolve to user IDs via team_members
            const { data: members, error: teamErr } = await supabaseClient
                .from('team_members')
                .select('user_id')
                .in('team_id', targetIds);

            if (teamErr) throw new Error('Failed to resolve team members: ' + teamErr.message);
            userIds = (members || []).map((m: any) => m.user_id);

        } else if (targetType === 'batches' && targetIds?.length > 0) {
            // targetIds are batch UUIDs → get teams in those batches → get members
            const { data: teams, error: batchErr } = await supabaseClient
                .from('teams')
                .select('id')
                .in('batch_id', targetIds);

            if (batchErr) throw new Error('Failed to resolve batch teams: ' + batchErr.message);

            const teamIds = (teams || []).map((t: any) => t.id);

            if (teamIds.length > 0) {
                const { data: members, error: memberErr } = await supabaseClient
                    .from('team_members')
                    .select('user_id')
                    .in('team_id', teamIds);

                if (memberErr) throw new Error('Failed to resolve team members: ' + memberErr.message);
                userIds = (members || []).map((m: any) => m.user_id);
            }
        }
        // else: targetType === 'all' or missing → userIds stays empty → fetch ALL tokens

        // ─── Fetch FCM tokens ───
        let query = supabaseClient
            .from('fcm_tokens')
            .select('token')

        if (userIds.length > 0) {
            query = query.in('user_id', userIds)
        }

        const { data: tokenRows, error: fetchError } = await query

        if (fetchError) {
            throw new Error('Failed to fetch FCM tokens: ' + fetchError.message)
        }

        const tokens = tokenRows
            ?.map((p: any) => p.token)
            .filter((t: string) => t && t.length > 0) || []

        // ─── Insert notification record with targeting info ───
        const sentToLabel = targetType === 'all' || !targetType
            ? 'all'
            : `${targetType}: ${targetIds?.length || 0} selected`;

        await supabaseClient.from('admin_notifications').insert({
            title,
            body,
            sent_to: sentToLabel,
            sent_count: 0,
            target_type: targetType || 'all',
            target_ids: targetIds || [],
        });

        if (tokens.length === 0) {
            return new Response(
                JSON.stringify({ success: true, sent_count: 0, message: 'No devices registered for selected targets' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ─── Send FCM messages ───
        const accessToken = await getAccessToken(serviceAccount);
        const projectId = serviceAccount.project_id;
        const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

        let sentCount = 0;
        let failedCount = 0;
        const responses = [];
        let firstError = null;
        let firstErrorToken = null;

        for (const token of tokens) {
            const fcmPayload = {
                message: {
                    token: token,
                    notification: { title, body },
                    data: { type: 'admin_push', title, body },
                }
            };

            const fcmResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fcmPayload)
            });

            const responseData = await fcmResponse.json();
            responses.push(responseData);

            if (fcmResponse.ok) {
                sentCount++;
            } else {
                failedCount++;
                if (!firstError) {
                    firstError = responseData.error?.message || responseData.error || 'Unknown error';
                    firstErrorToken = token;
                }
                console.error("FCM Send Error for token:", token, responseData);
            }
        }

        // Update notification record with actual sent count
        if (sentCount > 0) {
            const { error: updateError } = await supabaseClient
                .from('admin_notifications')
                .update({ sent_count: sentCount })
                .eq('title', title)
                .order('sent_at', { ascending: false })
                .limit(1)

            if (updateError) {
                console.warn('Failed to update sent_count:', updateError.message)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                sent_count: sentCount,
                failed_count: failedCount,
                total_devices: tokens.length,
                first_error: firstError,
                first_error_token: firstErrorToken,
                project_id: projectId,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error sending push notification:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
