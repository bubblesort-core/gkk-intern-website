// @deno-types="npm:@types/nodemailer"
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReminderRequest {
  email: string;
  name?: string;
  reminderType: "create_account_reminder" | "payment_reminder";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const body = await req.json() as ReminderRequest;
    const { email, name, reminderType } = body;

    if (!email || !reminderType) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields: email, reminderType" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid email format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (reminderType !== "create_account_reminder" && reminderType !== "payment_reminder") {
      return new Response(JSON.stringify({ success: false, error: "Invalid reminder type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const smtpUser = (Deno.env.get("SMTP_USER") || "noreplay.gkk26@gmail.com").trim();
    const smtpPass = (Deno.env.get("SMTP_PASS") || "yutfmttgqvligqsm").trim().replace(/\s+/g, "");

    if (!smtpUser || !smtpPass) {
      return new Response(JSON.stringify({ success: false, error: "SMTP credentials not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
    });

    const firstName = String(name || "Candidate").trim().split(" ")[0] || "Candidate";

    let subject = "";
    let text = "";
    let html = "";

    if (reminderType === "create_account_reminder") {
      subject = "Action Required: Create Your GKK Account";
      text = `Dear ${firstName},\n\nWelcome to GKK Interns. To continue with onboarding, please create your account using the link below and complete your profile.\n\nCreate your account: https://gkkintern.in/dashboard/user/signup\n\nImportant: After account creation, the next step is training fee payment from your dashboard home.\nOpen dashboard home: https://gkkintern.in/dashboard/home\n\nIf you already completed this step, you can ignore this reminder.\n\nBest regards,\nGKK INTERN TEAM`;
      html = `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#ffffff;padding:24px 28px;">
              <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">GKK INTERN TEAM</div>
              <h2 style="margin:8px 0 0 0;font-size:24px;">Create Your Account</h2>
            </div>
            <div style="padding:28px;color:#0f172a;line-height:1.7;">
              <p style="margin-top:0;">Dear <strong>${firstName}</strong>,</p>
              <p>Please create your GKK account to continue onboarding and access your next application step.</p>
              <div style="margin:26px 0;">
                <a href="https://gkkintern.in/dashboard/user/signup" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">Create Account</a>
              </div>
              <div style="padding:14px 16px;border:1px solid #bfdbfe;background:#eef5ff;border-radius:10px;color:#1e3a8a;font-size:14px;">
                Once your account is created, your next step is to complete training fee payment from dashboard home.
              </div>
              <div style="margin:16px 0 4px;">
                <a href="https://gkkintern.in/dashboard/home" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700;">Open Dashboard Home</a>
              </div>
              <div style="padding:14px 16px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:10px;color:#1e3a8a;font-size:14px;">
                If you already completed this step, no further action is needed.
              </div>
              <p style="margin-top:24px;">Best regards,<br><strong>GKK INTERN TEAM</strong></p>
            </div>
          </div>
        </div>
      `;
    } else {
      subject = "Payment Reminder: Complete Your GKK Internship Fee";
      text = `Dear ${firstName},\n\nThis is a friendly reminder to complete your internship training payment so we can keep your application active.\n\nOpen dashboard home: https://gkkintern.in/dashboard/home\n\nIf you already completed payment, thank you and please ignore this reminder.\n\nBest regards,\nGKK INTERN TEAM`;
      html = `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
          <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#b45309,#f59e0b);color:#ffffff;padding:24px 28px;">
              <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">GKK INTERN TEAM</div>
              <h2 style="margin:8px 0 0 0;font-size:24px;">Payment Reminder</h2>
            </div>
            <div style="padding:28px;color:#0f172a;line-height:1.7;">
              <p style="margin-top:0;">Dear <strong>${firstName}</strong>,</p>
              <p>Please complete your internship training payment to keep your application active and continue onboarding.</p>
              <div style="margin:26px 0;">
                <a href="https://gkkintern.in/dashboard/home" style="display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;">Open Dashboard Home</a>
              </div>
              <div style="padding:14px 16px;border:1px solid #fed7aa;background:#fff7ed;border-radius:10px;color:#9a3412;font-size:14px;">
                If your payment is already complete, you can ignore this email.
              </div>
              <p style="margin-top:24px;">Best regards,<br><strong>GKK INTERN TEAM</strong></p>
            </div>
          </div>
        </div>
      `;
    }

    await transporter.sendMail({
      from: `"GKK INTERN TEAM" <${smtpUser}>`,
      to: normalizedEmail,
      subject,
      text,
      html,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-reminder-email error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
