import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json();
        const { action, email, code, token } = body;

        const rawUser = Deno.env.get('SMTP_USER');
        const rawPass = Deno.env.get('SMTP_PASS');

        // SMTP Configuration from process.env (set via supabase secrets)
        const SMTP_USER = (rawUser || "noreplay.gkk26@gmail.com").trim();
        const SMTP_PASS = (rawPass || "thjr mrha bvst ksbz").trim().replace(/\s+/g, '');

        if (!SMTP_USER || !SMTP_PASS) {
            throw new Error('SMTP credentials not configured on Supabase side.')
        }

        if (action === 'send-otp') {
            if (!email) throw new Error('Email is required');

            const otp = Math.floor(100000 + Math.random() * 900000).toString()
            const expiry = Date.now() + 5 * 60 * 1000 // 5 mins

            // Basic token for database-free verification
            const verifyToken = btoa(`${otp}:${expiry}:${SMTP_PASS.slice(0, 5)}`)

            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // STARTTLS
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
                tls: {
                    ciphers: 'SSLv3',
                    rejectUnauthorized: false
                }
            });

            await transporter.sendMail({
                from: `"GKK Hiring" <${SMTP_USER}>`,
                to: email.trim(),
                subject: `Verification Code: ${otp}`,
                text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
                html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #10b981;">GKK Verification</h2>
            <p>Your verification code is:</p>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <strong style="font-size: 32px; letter-spacing: 4px; color: #10b981;">${otp}</strong>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 15px;">This code expires in 5 minutes.</p>
          </div>
        `,
            });

            return new Response(JSON.stringify({ success: true, verifyToken }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        if (action === 'verify-otp') {
            if (!token || !code) throw new Error('Token and Code are required for verification');

            // Decode the token and compare
            const decoded = atob(token)
            const [storedOtp, expiry, salt] = decoded.split(':')

            if (Date.now() > parseInt(expiry)) {
                return new Response(JSON.stringify({ success: false, message: 'OTP Expired' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            if (code === storedOtp && salt === SMTP_PASS.slice(0, 5)) {
                return new Response(JSON.stringify({ success: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            return new Response(JSON.stringify({ success: false, message: 'Invalid Code' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        throw new Error('Invalid action requested')

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Function Error Backend:", errorMsg);
        return new Response(JSON.stringify({
            success: false,
            error: errorMsg,
            details: "Please check your SMTP secrets if this is an authentication error."
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so the Supabase client can parse the body
        })
    }
})
