// @deno-types="npm:@types/nodemailer"
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  email: string;
  name: string;
  type: "approved" | "rejected" | "shortlisted" | "received" | "interview" | "create_account_reminder" | "payment_reminder" | "meeting_details" | "custom";
  preferredTiming?: string;
  preferredDate?: string;
  customSubject?: string;
  customBody?: string;
  meetLink?: string; // Added for interview
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    let body: EmailRequest;
    try {
      body = await req.json() as EmailRequest;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { email, name, type, preferredTiming, preferredDate, customSubject, customBody, meetLink } = body;

    console.log(`Attempting to send '${type}' email to ${email}`);

    if (!email || !type) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields: email, type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate email format (Supports single or multiple comma-separated)
    const emails = email.split(',').map(e => e.trim()).filter(e => e);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const invalidEmails = emails.filter(e => !emailRegex.test(e));
    if (invalidEmails.length > 0) {
      return new Response(JSON.stringify({ success: false, error: `Invalid email format: ${invalidEmails.join(', ')}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate type
    const validTypes = ["approved", "rejected", "shortlisted", "received", "interview", "create_account_reminder", "payment_reminder", "meeting_details", "custom"];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ success: false, error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Determine if bulk send
    const isBulk = emails.length > 1;

    const smtpUser = Deno.env.get("SMTP_USER") || "noreplay.gkk26@gmail.com";
    const smtpPass = Deno.env.get("SMTP_PASS") || "yutfmttgqvligqsm";

    if (!smtpUser || !smtpPass) {
      console.error("Missing SMTP credentials");
      return new Response(JSON.stringify({ success: false, error: "Server configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(`Configuring SMTP with user: ${smtpUser.substring(0, 3)}***`);

    // Create transporter with explicit configuration for Deno
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const containerStyle = "font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);";
    const headerStyle = "background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; text-align: center;";
    const contentStyle = "padding: 32px 24px; color: #334155; line-height: 1.6; font-size: 16px;";
    const footerStyle = "background-color: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0;";

    // Status specific colors
    const colors = {
      approved: { bg: '#ecfdf5', text: '#065f46', border: '#10b981', icon: '🎉' },
      rejected: { bg: '#fef2f2', text: '#991b1b', border: '#ef4444', icon: '📄' },
      shortlisted: { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6', icon: '⭐' },
      interview: { bg: '#fffbeb', text: '#92400e', border: '#f59e0b', icon: '📅' },
      create_account_reminder: { bg: '#f0f9ff', text: '#0c4a6e', border: '#0ea5e9', icon: '👤' },
      payment_reminder: { bg: '#fff7ed', text: '#9a3412', border: '#f97316', icon: '💳' },
      received: { bg: '#f0f9ff', text: '#0c4a6e', border: '#0ea5e9', icon: '📬' },
      meeting_details: { bg: '#f5f3ff', text: '#4c1d95', border: '#8b5cf6', icon: '📍' },
      custom: { bg: '#f8fafc', text: '#334155', border: '#64748b', icon: '📢' }
    };

    let subject = "";
    let html = "";
    let text = "";

    // If bulk, force generic name
    const recipientName = isBulk ? "Candidate" : (name || "Candidate");

    if (type === "custom") {
      subject = customSubject || "Update from GKK TEAM";
      // Convert newlines to breaks for HTML
      const formattedBody = customBody ? customBody.replace(/\n/g, '<br>') : 'No content provided.';
      text = `Dear ${recipientName},\n\n${customBody}\n\nBest regards,\nThe GKK TEAM`;

      html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">${customSubject || 'Official Update'}</p>
          </div>
          
          <div style="${contentStyle}">
            <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
            
            <div style="margin: 24px 0;">
              ${formattedBody}
            </div>

            <p>Best regards,<br><strong>The GKK TEAM</strong></p>
          </div>
          
          <div style="${footerStyle}">
            <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
            <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (type === "approved") {
      subject = "🎉 Congratulations! You're Hired - GKK Internship";
      text = `Dear ${recipientName},\n\nCongratulations! Your application for the GKK Internship Program has been APPROVED.\n\nYour skills impressed our team, and we're excited to have you join us.\n\nPlease sign up to your dashboard to complete your profile and start your journey.\n\nBest regards,\nThe GKK TEAM`;

      html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Welcome Aboard!</p>
          </div>
          
          <div style="${contentStyle}">
            <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
            
            <div style="background-color: ${colors.approved.bg}; color: ${colors.approved.text}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.approved.border}; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; display: flex; align-items: center;">
                🎉 Application Approved
              </h3>
              <p style="margin: 0; font-size: 15px;">
                Congratulations! Your skills and profile stood out among a competitive pool of applicants. We're excited to welcome you to the GKK Internship Program.
              </p>
            </div>
            
            <h3 style="color: #1e293b; font-size: 18px; margin: 24px 0 16px 0;">📋 Your Next Steps:</h3>
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px;">
              <ol style="margin: 0; padding-left: 20px; color: #334155;">
                <li style="margin-bottom: 12px;"><strong>Sign Up</strong>: Create your official account using the button below.</li>
                <li style="margin-bottom: 12px;"><strong>Login</strong>: Access your personalized dashboard.</li>
                <li style="margin-bottom: 12px;"><strong>Training Fees</strong>: Complete the payment to unlock training materials and the project dashboard.</li>
                <li><strong>Start Learning</strong>: Begin your real-world project journey immediately!</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://gkkintern.in/dashboard/user/signup" style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: background-color 0.2s;">
                Create Your Account &rarr;
              </a>
            </div>
            
            <p>We're committed to your growth and can't wait to see what you build!</p>
            <p>Best regards,<br><strong>The GKK TEAM</strong></p>
          </div>
          
          <div style="${footerStyle}">
            <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
            <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (type === "create_account_reminder") {
      subject = "Action Required: Create Your GKK Account";
      text = `Dear ${recipientName},\n\nWelcome to GKK Interns. To continue your onboarding, please create your account and complete your profile using the link below.\n\nCreate your account: https://gkkintern.in/dashboard/user/signup\n\nIf you already finished this step, you can ignore this reminder.\n\nBest regards,\nThe GKK TEAM`;

      html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Account Setup Reminder</p>
          </div>

          <div style="${contentStyle}">
            <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>

            <div style="background-color: ${colors.create_account_reminder.bg}; color: ${colors.create_account_reminder.text}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.create_account_reminder.border}; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; display: flex; align-items: center;">
                👤 Account Reminder
              </h3>
              <p style="margin: 0; font-size: 15px;">
                Please create your account to continue your application and unlock the next step of the process.
              </p>
            </div>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b;">What you need to do</h4>
              <ul style="margin: 0; padding-left: 20px; color: #475569;">
                <li style="margin-bottom: 8px;">Create your account using the button below.</li>
                <li style="margin-bottom: 8px;">Complete your profile after sign up.</li>
                <li>Then continue from your dashboard whenever you’re ready.</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://gkkintern.in/dashboard/user/signup" style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                Create Your Account &rarr;
              </a>
            </div>

            <p>Once your account is ready, you can continue from your dashboard.</p>
            <p>Best regards,<br><strong>The GKK TEAM</strong></p>
          </div>

          <div style="${footerStyle}">
            <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
            <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (type === "payment_reminder") {
      subject = "Payment Reminder: Complete Your GKK Internship Fee";
      text = `Dear ${recipientName},\n\nThis is a friendly reminder to complete your internship training payment so we can keep your application active.\n\nOpen your dashboard: https://gkkintern.in/dashboard/user/login\n\nIf you have already paid, thank you and please ignore this reminder.\n\nBest regards,\nThe GKK TEAM`;

      html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Complete Payment</p>
          </div>

          <div style="${contentStyle}">
            <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>

            <div style="background-color: ${colors.payment_reminder.bg}; color: ${colors.payment_reminder.text}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.payment_reminder.border}; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; display: flex; align-items: center;">
                💳 Payment Reminder
              </h3>
              <p style="margin: 0; font-size: 15px;">
                Please complete the training fee payment to keep your application active.
              </p>
            </div>

            <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; border: 1px solid #fed7aa; margin-bottom: 24px;">
               <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #9a3412;">What to do next</h4>
               <ul style="margin: 0; padding-left: 20px; color: #7c2d12;">
                 <li style="margin-bottom: 8px;">Log in to your dashboard</li>
                 <li style="margin-bottom: 8px;">Open the payment section</li>
                 <li>Complete the payment to continue your onboarding</li>
               </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://gkkintern.in/dashboard/user/login" style="background-color: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">
                Open Dashboard &rarr;
              </a>
            </div>

            <p>We look forward to having you on board.</p>
            <p>Best regards,<br><strong>The GKK TEAM</strong></p>
          </div>

          <div style="${footerStyle}">
            <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
            <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (type === "interview") {
      subject = "📅 Interview Invitation - GKK Internship";
      const meetLinkHtml = meetLink
        ? `<div style="text-align: center; margin: 24px 0;">
             <a href="${meetLink}" style="background-color: #0d9488; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);">
               Join Google Meet &rarr;
             </a>
             <p style="margin-top: 12px; font-size: 13px; color: #64748b;">Link: <a href="${meetLink}" style="color: #0d9488;">${meetLink}</a></p>
           </div>`
        : `<p style="color: #64748b; font-style: italic; text-align: center;">A Google Meet link will be shared shortly.</p>`;

      text = `Dear ${recipientName},\n\nGreat news! You've been selected for an interview.\n\nDate: ${preferredDate || 'TBD'}\nTime: ${preferredTiming || 'TBD'}\nLink: ${meetLink || 'Will be shared soon'}\n\nPlease be ready 5 minutes early.\n\nBest regards,\nThe GKK TEAM`;

      html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Interview Invitation</p>
          </div>
          
          <div style="${contentStyle}">
            <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
            
            <div style="background-color: ${colors.interview.bg}; color: ${colors.interview.text}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.interview.border}; margin: 24px 0;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; display: flex; align-items: center;">
                📅 Interview Scheduled
              </h3>
              <p style="margin: 0; font-size: 15px;">
                We saw great potential in your application and would love to chat. Please confirm your availability for the following slot.
              </p>
            </div>
            
            <div style="display: flex; gap: 16px; margin: 24px 0; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 140px; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Date</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #0f172a;">${preferredDate || 'To be scheduled'}</p>
              </div>
              <div style="flex: 1; min-width: 140px; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600;">Time</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #0f172a;">${preferredTiming || 'To be confirmed'}</p>
              </div>
            </div>

            ${meetLinkHtml}

            <div style="background-color: #fff; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <h4 style="margin: 0 0 8px 0; font-size: 15px; color: #334155;">✅ Preparation Checklist:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px;">
                <li>Have your resume and portfolio open</li>
                <li>Test your camera and microphone</li>
                <li>Join from a quiet location</li>
              </ul>
            </div>
            
            <p style="margin-top: 24px;">We look forward to speaking with you!</p>
            <p>Best regards,<br><strong>The GKK TEAM</strong></p>
          </div>
          
          <div style="${footerStyle}">
            <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
            <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
          </div>
        </div>
      `;
    } else if (type === "shortlisted") {
      subject = "⭐ You're Shortlisted - GKK Internship";
      text = `Dear ${recipientName},\n\nExciting news! Your application for the GKK Internship Program has been SHORTLISTED.\n\nThis means your profile looks promising. We'll inform you soon about the next steps.\n\nBest regards,\nThe GKK TEAM`;

      html = `
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Application Status Update</p>
            </div>
            
            <div style="${contentStyle}">
              <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
              
              <div style="background-color: ${colors.shortlisted.bg}; color: ${colors.shortlisted.text}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.shortlisted.border}; margin: 24px 0;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; display: flex; align-items: center;">
                  ⭐ You've been Shortlisted!
                </h3>
                <p style="margin: 0; font-size: 15px;">
                  Your profile has caught our attention! You have passed the initial screening round.
                </p>
              </div>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
                 <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b;">What happens now?</h4>
                 <ul style="margin: 0; padding-left: 20px; color: #475569;">
                   <li style="margin-bottom: 8px;">Our team is reviewing your detailed portfolio.</li>
                   <li style="margin-bottom: 8px;">We are matching you with potential project tracks.</li>
                   <li>You will hear from us within <strong>3-5 business days</strong> regarding an interview or final decision.</li>
                 </ul>
              </div>
              
              <p style="margin-top: 24px;">Please keep an eye on your inbox (and spam folder) for further updates.</p>
              <p>Best regards,<br><strong>The GKK TEAM</strong></p>
            </div>
            
            <div style="${footerStyle}">
              <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
              <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
            </div>
          </div>
        `;
    } else if (type === "rejected") {
      subject = "Application Status Update - GKK Internship";
      text = `Dear ${recipientName},\n\nThank you for applying to the GKK Internship Program.\n\nAfter careful consideration, we've decided not to move forward with your application at this time.\n\nWe encourage you to apply again in the future.\n\nBest regards,\nThe GKK TEAM`;

      html = `
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Application Update</p>
            </div>
            
            <div style="${contentStyle}">
              <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
              
              <div style="background-color: ${colors.rejected.bg}; color: ${colors.rejected.text}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.rejected.border}; margin: 24px 0;">
                <p style="margin: 0; font-size: 15px;">
                  Thank you for applying to the GKK Internship Program. After careful consideration, we have decided not to move forward with your application at this time.
                </p>
              </div>
              
              <p>We received a high volume of applications this season. This is not a reflection of your potential, but rather the specific needs of our current projects.</p>
              
              <div style="margin-top: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1e293b;">Keep Growing 🌱</h4>
                <p style="margin: 0; color: #475569;">
                   We encourage you to continue building your skills and portfolio. We would love to see you apply again for our next batch.
                </p>
              </div>
              
              <p style="margin-top: 24px;">Best regards,<br><strong>The GKK TEAM</strong></p>
            </div>
            
            <div style="${footerStyle}">
              <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
              <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
            </div>
          </div>
        `;
    } else if (type === "received") {
      subject = "✉️ Application Received - GKK Internship";
      text = `Dear ${recipientName},\n\nWe've received your application for the GKK Internship Program.\n\nOur team is reviewing your profile. We aim to get back to you within 3-5 business days.\n\nBest regards,\nThe GKK TEAM`;

      html = `
          <div style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">We've Received Your Application</p>
            </div>
            
            <div style="${contentStyle}">
              <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
              
              <div style="background-color: ${colors.received.bg}; color: ${colors.received.text}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.received.border}; margin: 24px 0;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; display: flex; align-items: center;">
                  ✅ Application Submitted
                </h3>
                <p style="margin: 0; font-size: 15px;">
                  Thank you! We have successfully received your application for the GKK Internship Program.
                </p>
              </div>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                 <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b;">Timeline Preview</h4>
                 <div style="display: flex; gap: 12px; font-size: 14px; color: #475569; margin-bottom: 8px;">
                    <span>📅</span> <span><strong>Review Period:</strong> 3-5 Business Days</span>
                 </div>
                 <div style="display: flex; gap: 12px; font-size: 14px; color: #475569;">
                    <span>📧</span> <span><strong>Next Step:</strong> Email notification of status</span>
                 </div>
              </div>
              
              <p>While you wait, feel free to review your portfolio and ensure all links are accessible.</p>
              
              <p>Best regards,<br><strong>The GKK TEAM</strong></p>
            </div>
            
            <div style="${footerStyle}">
              <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
              <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
            </div>
          </div>
        `;
    } else if (type === "meeting_details") {
      subject = "📍 Meeting Joining Details - GKK Interview";
      const meetingLink = meetLink || "https://meet.google.com/";
      
      text = `Dear ${recipientName},\n\nYour interview joining details are confirmed.\n\nSchedule: ${preferredDate || 'TBD'} at ${preferredTiming || 'TBD'}\nJoining Link: ${meetingLink}\n\nImportant Notes:\n- Join from a quiet location\n- Ensure stable internet connection\n- Use clear audio/video device\n\nBest regards,\nThe GKK TEAM`;

      html = `
        <div style="${containerStyle}">
          <div style="${headerStyle}; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">GKK TEAM</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Meeting Joining Details</p>
          </div>
          
          <div style="${contentStyle}">
            <p style="margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
            
            <p>Your interview joining details have been confirmed. Please find the schedule and link below:</p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
              <div style="margin-bottom: 20px;">
                <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Interview Schedule</p>
                <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">${preferredDate || 'Scheduled'} @ ${preferredTiming || 'Confirmed Time'}</p>
              </div>

              <a href="${meetingLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                Join Interview Now
              </a>

              <div style="margin-top: 16px;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8;">If the button doesn't work, copy this link:</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #4f46e5; word-break: break-all;">${meetingLink}</p>
              </div>
            </div>

            <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <h4 style="margin: 0 0 8px 0; font-size: 15px; color: #4c1d95; display: flex; align-items: center; gap: 8px;">
                📝 Important Notes:
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: #5b21b6; font-size: 14px;">
                <li style="margin-bottom: 4px;">Join from a <strong>quiet location</strong> to avoid background noise.</li>
                <li style="margin-bottom: 4px;">Ensure you have a <strong>stable internet connection</strong>.</li>
                <li>Use a device with <strong>clear audio and video</strong> capabilities.</li>
              </ul>
            </div>
            
            <p style="margin-top: 24px;">We look forward to meeting you!</p>
            <p>Best regards,<br><strong>The GKK TEAM</strong></p>
          </div>
          
          <div style="${footerStyle}">
            <p style="margin: 0;">Questions? Reply to this email or contact noreplay.gkk26@gmail.com</p>
            <p style="margin: 8px 0 0 0;">&copy; ${new Date().getFullYear()} GKK TEAM. All rights reserved.</p>
          </div>
        </div>
      `;
    }

    // Send Mail
    // If bulk (more than 1 recipient), use BCC to hide emails from each other
    const mailOptions = {
      from: '"GKK INTERN TEAM" <noreplay.gkk26@gmail.com>',
      subject: subject,
      text: text,
      html: html,
      to: isBulk ? '"GKK Candidates" <noreplay.gkk26@gmail.com>' : email,
      bcc: isBulk ? emails : undefined
    };

    console.log(`Sending email to ${isBulk ? 'Multiple Recipients (' + emails.length + ')' : email} with subject: ${subject}`);

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully, MessageID:", info.messageId);

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("Error sending email:", errorMessage);
    console.error("Stack:", errorStack);

    // Return more specific error info for debugging
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: "Check server logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
