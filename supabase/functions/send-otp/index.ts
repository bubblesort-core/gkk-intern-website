
// @deno-types="npm:@types/nodemailer"
import nodemailer from "npm:nodemailer@6.9.13";
import { createClient } from "npm:@supabase/supabase-js@2.47.10";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

interface OtpRequest {
    email: string;
    otp: string;
    name: string;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json();

        // Handle both direct invocation and Supabase Auth Hook payload
        let email, otp, name;

        if (body.email_data && body.email_data.token) {
            // Supabase Auth Hook Payload
            console.log("Received Supabase Auth Hook payload");
            email = body.user.email;
            otp = body.email_data.token;
            // Try to get name from metadata
            name = body.user.user_metadata?.full_name || body.user.user_metadata?.first_name || 'User';
        } else {
            // Direct Invocation (Legacy/Manual)
            console.log("Received Direct Invocation payload");
            email = body.email;
            otp = body.otp;
            name = body.name;
        }

        if (!email || !otp) {
            throw new Error("Missing required fields (email or otp)");
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        // ------------------------------------------------------------------------
        // STRICT SECURITY CHECK: Verify User Status Before Sending
        // ------------------------------------------------------------------------
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Initialize Supabase Admin Client
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch recent applications with loose match, then normalize in code
        const { data: apps, error: dbError } = await supabase
            .from("applications")
            .select("email, status")
            .ilike("email", `%${normalizedEmail}%`)
            .order("created_at", { ascending: false })
            .limit(10);

        if (dbError) {
            console.error("Database check failed:", dbError);
            throw new Error("Internal Server Error: Could not verify status");
        }

        const normalizedMatches = (apps || []).filter((app) => {
            const appEmail = String(app.email || '').trim().toLowerCase();
            return appEmail === normalizedEmail;
        });

        const candidateMatches = normalizedMatches.length > 0 ? normalizedMatches : (apps || []);

        const hasApproved = candidateMatches.some((app) => {
            const status = String(app.status || '').trim().toLowerCase();
            return status === 'approved' || status.includes('approved');
        });

        if (hasApproved) {
            console.log(`Approved application found for ${normalizedEmail}`);
        } else {
            const appStatus = candidateMatches.length > 0
                ? String(candidateMatches[0].status || '').trim().toLowerCase()
                : null;

            console.log(`Checking status for ${normalizedEmail}: ${appStatus}`);

            // STRICT BLOCK: Only "approved" status is allowed
            let errorMsg = "Access Denied: You are not approved yet.";

            if (appStatus === "shortlisted") {
                errorMsg = "Access Denied: Your application is Shortlisted. Please wait for the final interview call letter.";
            } else if (appStatus === "ready_interview") {
                errorMsg = "Access Denied: You are Ready for Interview. Please check your email for the schedule.";
            } else if (appStatus === "rejected") {
                errorMsg = "Access Denied: Unfortunately, your application was not selected.";
            } else if (!appStatus) {
                errorMsg = "Access Denied: No application found. Please apply first.";
            } else {
                errorMsg = `Access Denied: Application status is ${appStatus}. Please wait for approval.`;
            }

            console.error(`Blocking OTP for ${normalizedEmail} (Status: ${appStatus})`);

            // Return 403 so Supabase/Frontend knows it failed and shows the message
            return new Response(JSON.stringify({ success: false, error: errorMsg }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }
        // ------------------------------------------------------------------------

        const smtpUser = Deno.env.get("SMTP_USER") || "noreplay.gkk26@gmail.com";
        const smtpPass = Deno.env.get("SMTP_PASS") || "yutfmttgqvligqsm";

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });

        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
           <h1 style="color: #10b981; margin: 0; font-size: 24px;">GKK TEAM</h1>
        </div>
        
        <p style="color: #374151; font-size: 16px;">Hello ${name || 'User'},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">
          You requested to create an account on GKK TEAM Intern Portal. Use the One-Time Password (OTP) below to verify your email address.
        </p>

        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This OTP is valid for 10 minutes. If you did not request this, please ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.
        </p>
      </div>
    `;

        const info = await transporter.sendMail({
            from: '"GKK INTERN TEAM" <noreplay.gkk26@gmail.com>',
            to: normalizedEmail,
            subject: "Your Verification Code - GKK TEAM",
            html: html,
        });

        console.log("OTP sent successfully, MessageID:", info.messageId);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error sending OTP:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return new Response(JSON.stringify({ success: false, error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
