import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer@6.9.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, text, html } = await req.json() as EmailRequest

        if (!to || !subject || !text) {
            throw new Error('Missing required fields: to, subject, text')
        }

        // Initialize Nodemailer with Gmail SMTP
        // NOTE: In production, it's safer to use Environment Variables for these credentials.
        // For this task, we are using the provided credentials directly as requested/agreed.
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use STARTTLS
            auth: {
                user: Deno.env.get('SMTP_USER') || 'noreplay.gkk26@gmail.com',
                pass: Deno.env.get('SMTP_PASS') || 'yutfmttgqvligqsm',
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });

        // Send Email
        const info = await transporter.sendMail({
            from: '"GKK INTERN TEAM" <noreplay.gkk26@gmail.com>',
            to: to,
            subject: subject,
            text: text,
            html: html || text, // Fallback to text if HTML not provided
        });

        console.log("Message sent: %s", info.messageId);

        return new Response(
            JSON.stringify({ success: true, messageId: info.messageId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("Error sending email:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
