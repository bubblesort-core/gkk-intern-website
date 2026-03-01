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
        const { email, name } = await req.json();

        if (!email || !name) {
            throw new Error('Missing required fields: email, name');
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

        const firstName = name.split(' ')[0] || 'Future Intern';

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Received</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        table { border-collapse: collapse; width: 100%; }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            margin-top: 40px;
            margin-bottom: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 40px 0;
            text-align: center;
        }
        .logo-text {
            color: #ffffff;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin: 0;
            text-transform: uppercase;
        }
        .content {
            padding: 40px;
            text-align: center;
        }
        .title {
            color: #1e293b;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 16px;
            margin-top: 0;
        }
        .text {
            color: #64748b;
            font-size: 16px;
            line-height: 26px;
            margin-bottom: 16px;
        }
        .highlight-box {
            background-color: #f0fdf4;
            border-radius: 12px;
            padding: 24px;
            margin: 28px 0;
            border: 1px solid #bbf7d0;
            text-align: left;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 14px;
        }
        .step:last-child {
            margin-bottom: 0;
        }
        .step-icon {
            color: #10b981;
            font-size: 18px;
            font-weight: 700;
            margin-right: 12px;
            min-width: 24px;
        }
        .step-text {
            color: #334155;
            font-size: 15px;
            line-height: 22px;
        }
        .cta-button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            margin-top: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #94a3b8;
            font-size: 12px;
            line-height: 18px;
            margin: 0;
        }
        .highlight { color: #10b981; font-weight: 600; }
    </style>
</head>
<body>
    <table role="presentation">
        <tr>
            <td align="center">
                <div class="container">
                    <!-- Header -->
                    <div class="header">
                        <h1 class="logo-text">GKK INTERNS</h1>
                    </div>

                    <!-- Main Content -->
                    <div class="content">
                        <h2 class="title">Application Received! 🚀</h2>
                        <p class="text">
                            Hey <strong>${firstName}</strong>,<br>
                            Thank you for applying to the <span class="highlight">GKK Internship Program</span>!
                            We've successfully received your application.
                        </p>

                        <!-- Next Steps -->
                        <div class="highlight-box">
                            <div class="step">
                                <span class="step-icon">1.</span>
                                <span class="step-text"><strong>Profile Review</strong> — Our team will review your details and skillset.</span>
                            </div>
                            <div class="step">
                                <span class="step-icon">2.</span>
                                <span class="step-text"><strong>Interview Invite</strong> — If shortlisted, you'll get an invite via WhatsApp & Email.</span>
                            </div>
                            <div class="step">
                                <span class="step-icon">3.</span>
                                <span class="step-text"><strong>Onboarding</strong> — Selected candidates start with team assignments and projects.</span>
                            </div>
                        </div>

                        <p class="text" style="font-size: 14px;">
                            We appreciate your interest and will get back to you soon.<br>
                            In the meantime, explore what we do!
                        </p>

                        <a href="https://gkkintern.in" class="cta-button">Visit GKK Intern</a>
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                        <p class="footer-text">
                            &copy; 2026 GKK Interns. All rights reserved.<br>
                            Made with <span style="color: #ef4444;">&hearts;</span> for interns.
                        </p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        await transporter.sendMail({
            from: `"GKK Hiring" <${SMTP_USER}>`,
            to: email.trim(),
            subject: "Application Received — GKK Intern Program 🎉",
            text: `Hi ${firstName}, Thank you for applying to the GKK Internship Program! We've received your application and will review your profile. If shortlisted, you'll receive an interview invitation via WhatsApp and Email. Good luck!`,
            html: htmlContent,
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("Send application email error:", errorMsg);
        return new Response(JSON.stringify({
            success: false,
            error: errorMsg,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
