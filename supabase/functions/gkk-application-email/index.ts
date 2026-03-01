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
        const { applicationData } = await req.json();

        if (!applicationData || !applicationData.email) {
            throw new Error('Missing application data');
        }

        const rawUser = Deno.env.get('SMTP_USER');
        const rawPass = Deno.env.get('SMTP_PASS');

        const SMTP_USER = (rawUser || "noreplay.gkk26@gmail.com").trim();
        const SMTP_PASS = (rawPass || "thjr mrha bvst ksbz").trim().replace(/\s+/g, '');

        if (!SMTP_USER || !SMTP_PASS) {
            throw new Error('SMTP credentials not configured on Supabase side.');
        }

        // Use the same SMTP configuration as OTP verification
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

        // Send Notification Email to Admin only
        // (Candidate "thank you" email is handled by send-application-email function)
        const adminMailOptions = {
            from: `"GKK System" <${SMTP_USER}>`,
            to: SMTP_USER,
            subject: `New Application: ${applicationData.full_name}`,
            html: `
                <div style="font-family: monospace; color: #333;">
                    <h2 style="color: #f59e0b;">New Candidate Applied</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.full_name}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.email}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.phone}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>WhatsApp:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.whatsapp_number}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>College:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.college}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Age/Sex:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.age} / ${applicationData.sex}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Discovery:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.discovery_source}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Schedule:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${applicationData.interview_date} @ ${applicationData.interview_time}</td></tr>
                    </table>
                    
                    <h3 style="margin-top: 20px;">Links</h3>
                    <ul>
                        <li><a href="${applicationData.linkedin_url}">LinkedIn</a></li>
                        <li><a href="${applicationData.portfolio_url}">Portfolio</a></li>
                        <li><a href="${applicationData.github_url}">GitHub</a></li>
                    </ul>
                    
                    <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                        Review this application in the admin dashboard.
                    </p>
                </div>
            `
        };

        try {
            console.log("Sending admin notification email...");
            await transporter.sendMail(adminMailOptions);
            console.log("Admin notification email sent.");
        } catch (adminError) {
            const msg = adminError instanceof Error ? adminError.message : String(adminError);
            console.error("Failed to send admin email:", msg);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Email error:', errorMsg);
        return new Response(JSON.stringify({
            success: false,
            error: errorMsg,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
