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
        const { title, body, targetAudience, targetIds, batchFilter, teamFilter } = await req.json()

        if (!title || !body) {
            throw new Error('Missing required fields: title, body')
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let finalUserIds: string[] = [];

        if (!targetAudience || targetAudience === 'all') {
            // Get all active users
            const { data: members, error: allError } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('status', 'active');
            
            if (allError) throw new Error('Failed to resolve active users: ' + allError.message);
            finalUserIds = members.map((m: any) => m.id);

        } else if (targetAudience === 'specific') {
            // Only use the specific IDs that are active
            const { data: members, error: specificError } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('status', 'active')
                .in('id', targetIds || []);
            
            if (specificError) throw new Error('Failed to validate specific users: ' + specificError.message);
            finalUserIds = members.map((m: any) => m.id);

        } else if (targetAudience === 'team') {
            // Resolve team members who are active
            const { data: members, error: teamError } = await supabaseClient
                .from('team_members')
                .select('user_id, profiles!inner(status)')
                .eq('team_id', teamFilter)
                .eq('profiles.status', 'active');

            if (teamError) throw new Error('Failed to resolve team members: ' + teamError.message);
            finalUserIds = members.map((m: any) => m.user_id);

        } else if (targetAudience === 'batch') {
            // Resolve batch members who are active
            const { data: members, error: batchError } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('batch_id', batchFilter)
                .eq('status', 'active');

            if (batchError) throw new Error('Failed to resolve batch members: ' + batchError.message);
            finalUserIds = members.map((m: any) => m.id);
        }

        // Get FCM Service Account from env
        const serviceAccountStr = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')
        if (!serviceAccountStr) {
            throw new Error('FCM_SERVICE_ACCOUNT_JSON not configured.')
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountStr)
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
        } catch (parseError: any) {
            console.error('Failed to parse FCM_SERVICE_ACCOUNT_JSON:', parseError)
            throw new Error('FCM_SERVICE_ACCOUNT_JSON is malformed.')
        }

        // 1. Get FCM tokens from the dedicated fcm_tokens table
        let queryTokens = supabaseClient
            .from('fcm_tokens')
            .select('user_id, token')

        if (finalUserIds.length > 0) {
            queryTokens = queryTokens.in('user_id', finalUserIds)
        }

        const { data: fcmTableData, error: fetchError1 } = await queryTokens

        if (fetchError1) {
            throw new Error('Failed to fetch from fcm_tokens: ' + fetchError1.message)
        }

        // 2. Get tokens from profiles table (new fcm_token array column)
        let queryProfiles = supabaseClient
            .from('profiles')
            .select('id, fcm_token')

        if (targetIds && Array.isArray(targetIds) && targetIds.length > 0) {
            queryProfiles = queryProfiles.in('id', targetIds)
        }

        const { data: profileData, error: fetchError2 } = await queryProfiles

        if (fetchError2) {
            console.error('Failed to fetch from profiles:', fetchError2.message)
            // Continue with whatever tokens we have from fcm_tokens table
        }

        // Combine and unique-ify tokens
        const tokenMap = new Map(); // token -> user_id

        // Add from fcm_tokens table
        fcmTableData?.forEach((record: any) => {
            if (record.token) tokenMap.set(record.token, record.user_id);
        });

        // Add from profiles table array
        profileData?.forEach((record: any) => {
            if (Array.isArray(record.fcm_token)) {
                record.fcm_token.forEach((t: string) => {
                    if (t) tokenMap.set(t, record.id);
                });
            }
        });

        const distinctTokens = Array.from(tokenMap.entries()).map(([token, user_id]) => ({
            token,
            user_id
        }));

        if (distinctTokens.length === 0) {
            return new Response(
                JSON.stringify({ success: true, sent_count: 0, message: 'No devices registered' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Generate OAuth2 token
        const accessToken = await getAccessToken(serviceAccount);
        const projectId = serviceAccount.project_id;
        const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

        let sentCount = 0;
        let failedCount = 0;
        const responses = [];
        let firstError = null;
        let firstErrorToken = null;
        const successfulUserIds = [];

        for (const record of distinctTokens) {
            const token = record.token;
            const userId = record.user_id;

            const fcmPayload = {
                message: {
                    token: token,
                    notification: { title, body },
                    data: { type: 'admin_push', title, body }
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
                successfulUserIds.push(userId);
            } else {
                failedCount++;
                if (!firstError) {
                    firstError = responseData.error?.message || responseData.error || 'Unknown error';
                    firstErrorToken = token;
                }
                console.error("FCM Send Error for token:", token, responseData);
            }
        }

        if (successfulUserIds.length > 0) {
            // Update admin log
            await supabaseClient
                .from('admin_notifications')
                .update({ sent_count: sentCount })
                .eq('title', title)
                .order('sent_at', { ascending: false })
                .limit(1)

            // Insert into notifications history for each user
            const notificationHistory = successfulUserIds.map(uid => ({
                user_id: uid,
                title: title,
                message: body,
                is_read: false
            }));

            await supabaseClient
                .from('notifications')
                .insert(notificationHistory);
        }

        return new Response(
            JSON.stringify({
                success: true,
                sent_count: sentCount,
                failed_count: failedCount,
                total_devices: distinctTokens.length,
                first_error: String(firstError || ''),
                first_error_token: String(firstErrorToken || ''),
                project_id: String(projectId || '')
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error sending push notification:', error)
        return new Response(
            JSON.stringify({ success: false, error: String(error.message || error) }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
