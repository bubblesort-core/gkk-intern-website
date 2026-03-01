import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS (though webhooks usually come from servers, testing might need this)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Receive JSON from Android SMS Forwarder
        const { from, text, receivedStamp } = await req.json()

        if (!text) {
            throw new Error("Missing 'text' field in webhook payload")
        }

        console.log(`Received SMS from ${from}: ${text}`)

        // 2. Extract Amount using Regex
        // Regex matches:
        // - Bank SMS: "Rs. 100.45", "INR 100.45", "Rs 100.45"
        // - GPay notifications: "paid you ₹1.61", "₹100.45"
        const amountRegex = /(?:Rs\.?|INR|₹)\s*(\d+(?:\.\d{1,2})?)/i
        const amountMatch = text.match(amountRegex)

        if (!amountMatch) {
            console.log("No amount found in SMS text.")
            return new Response(JSON.stringify({ message: "No amount found via Regex", status: "ignored" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const startAmount = parseFloat(amountMatch[1])
        console.log(`Extracted Amount: ${startAmount}`)

        // 3. Find matching Pending Enrollment
        // We search for an EXACT match on unique_payment_amount that is Pending
        const { data: enrollment, error: fetchError } = await supabase
            .from('enrollments')
            .select('id, student_name, email')
            .eq('unique_payment_amount', startAmount)
            .eq('payment_status', 'Pending')
            // Optional: check if from known bank senders? 
            // .ilike('sms_sender', '%Bank%') 
            .maybeSingle()

        if (fetchError) {
            console.error("Database error looking up enrollment:", fetchError)
            throw new Error("Database error")
        }

        if (!enrollment) {
            console.log("No matching pending enrollment found for amount:", startAmount)
            return new Response(JSON.stringify({ message: "No match found", status: "ignored" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Extract UTR (Optional but recommended)
        // Common UTR patterns: "Ref No 123456", "UPI/123456/...", "UTR: 123456"
        // This is a basic guess regex, can be improved based on specific bank SMS
        const utrRegex = /(?:Ref\s?No|UTR|UPI)\W*(\d+)/i
        const utrMatch = text.match(utrRegex)
        const utrNumber = utrMatch ? utrMatch[1] : null

        // 5. Verify the Enrollment
        const { error: updateError } = await supabase
            .from('enrollments')
            .update({
                payment_status: 'Verified',
                utr_number: utrNumber,
                sms_sender: from,
                sms_text: text,
                sms_timestamp: receivedStamp
            })
            .eq('id', enrollment.id)

        if (updateError) {
            console.error("Failed to update enrollment status:", updateError)
            throw new Error("Failed to verify enrollment")
        }

        console.log(`Successfully verified payment for ${enrollment.student_name} (${enrollment.email})`)

        // 6. Auto-Create Profile (if linked to a user)
        const { data: currentEnrollment } = await supabase
            .from('enrollments')
            .select('user_id')
            .eq('id', enrollment.id)
            .single();

        if (currentEnrollment?.user_id) {
            // Check if profile already exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', currentEnrollment.user_id)
                .maybeSingle();

            if (!existingProfile) {
                console.log(`Creating profile for user ${currentEnrollment.user_id}...`);

                // Fetch Application details for skills/college
                const { data: application } = await supabase
                    .from('applications')
                    .select('college, skills')
                    .eq('email', enrollment.email)
                    .maybeSingle(); // Use maybeSingle as fallback if no app found?

                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: currentEnrollment.user_id,
                        email: enrollment.email,
                        full_name: enrollment.student_name,
                        // phone: enrollment.phone, // Profile schema currently only has email/name/college/skills in list? Let's check schema.sql. It does have phone.
                        // But wait, schema.sql says "phone TEXT".
                        college: application?.college || 'Unknown',
                        skills: application?.skills || [],
                        status: 'active', // Mark as active immediately upon payment
                        role: 'intern'
                    }]);

                if (profileError) {
                    console.error("Failed to create profile:", profileError);
                    // Don't throw, as payment is verified. Just log error.
                } else {
                    console.log("Profile created successfully via Webhook.");
                }
            }
        }

        // TODO: Send Welcome Email here (using another Edge Function or service) or trigger another workflow

        return new Response(
            JSON.stringify({ success: true, message: "Payment Verified", student: enrollment.student_name }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
