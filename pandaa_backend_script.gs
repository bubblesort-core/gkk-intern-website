/**
 * PANDAA Contact Form Backend V1.0 - Google Apps Script
 * 
 * Features:
 * 1. Automatically creates/updates spreadsheet headers.
 * 2. Sends notification to admin.
 * 3. Sends notification to admin.
 */

const ADMIN_EMAIL = "noreplay.gkk26@gmail.com";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = (data.action || '').toString().trim();

    if (action === 'send_reminder_email' || data.reminderType || data.source === 'ADMIN_REMINDER') {
      return handleReminderEmail(data);
    }

    return handleContactSubmission(data);
  } catch (error) {
    return jsonResponse({ "status": "error", "error": error.toString() });
  }
}

function handleContactSubmission(data) {
  const { email, message, source, token, name } = data;
  const safeMessage = (message || '').toString().trim() || 'No message provided.';
  const safeToken = (token || '').toString().trim() || 'Not provided.';
    
    // 1. Get/Create Spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Contact Submissions");
    
    if (!sheet) {
      sheet = ss.insertSheet("Contact Submissions");
      sheet.appendRow(["Timestamp", "Source", "Name", "Email", "Message", "User Token"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#3b42f2").setFontColor("white");
    }
    
    // 2. Log Data
    const timestamp = new Date();
    sheet.appendRow([timestamp, source || "PANDAA-BOT", name || "Unknown", email, message, token]);
    SpreadsheetApp.flush(); // Force immediate write
    
    // 3. Send Admin Notification
    const adminSubject = `🚨 NEW INQUIRY: ${source || "PANDAA"} - ${email}`;
    const adminBody = `
      New inquiry received via PANDAA Assistant (GKK INTERN).
      
      Time: ${timestamp}
      Source: ${source}
      Name: ${name || "N/A"}
      Email: ${email}
      Message: ${safeMessage}
      Token: ${safeToken}
    `;
    MailApp.sendEmail(ADMIN_EMAIL, adminSubject, adminBody);
    
  return jsonResponse({ "status": "success" });
}

function handleReminderEmail(data) {
  const email = (data.email || '').toString().trim();
  const recipientName = (data.name || 'Candidate').toString().trim();
  const reminderType = (data.reminderType || 'general_reminder').toString().trim();
  const source = (data.source || 'ADMIN_REMINDER').toString().trim();
  const applicationId = (data.applicationId || '').toString().trim();

  if (!email) {
    throw new Error('Reminder email target is missing');
  }

  const firstName = recipientName.split(' ')[0] || 'Candidate';

  let subject = '';
  let plainBody = '';
  let htmlBody = '';

  if (reminderType === 'create_account_reminder') {
    subject = 'Action Required: Create Your GKK Account';
    plainBody = `Dear ${firstName},\n\nWelcome to GKK Interns. To continue with your onboarding, please create your account using the link below and complete your profile.\n\nCreate your account: https://gkkintern.in/dashboard/user/signup\n\nIf you already created your account, you can ignore this message.\n\nBest regards,\nGKK Hire Team`;
    htmlBody = `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:28px;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:26px 28px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">GKK Interns</div>
            <h2 style="margin:8px 0 0 0;font-size:24px;line-height:1.2;">Create Your Account</h2>
          </div>
          <div style="padding:28px;color:#0f172a;line-height:1.7;font-size:16px;">
            <p style="margin-top:0;">Dear <strong>${firstName}</strong>,</p>
            <p>Please create your GKK account to continue with onboarding and access the next step of your application.</p>
            <div style="margin:28px 0;">
              <a href="https://gkkintern.in/dashboard/user/signup" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">Create Account</a>
            </div>
            <div style="padding:16px 18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;color:#1e3a8a;font-size:14px;">
              If you already completed this step, no further action is needed.
            </div>
            <p style="margin-top:24px;">Best regards,<br><strong>GKK Hire Team</strong></p>
          </div>
        </div>
      </div>
    `;
  } else {
    subject = 'Payment Reminder: Complete Your GKK Internship Fee';
    plainBody = `Dear ${firstName},\n\nThis is a friendly reminder to complete your internship training payment so we can keep your application active.\n\nOpen your dashboard: https://gkkintern.in/dashboard/user/login\n\nIf you have already paid, thank you and please ignore this message.\n\nBest regards,\nGKK Hire Team`;
    htmlBody = `
      <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:28px;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <div style="background:linear-gradient(135deg,#b45309,#f59e0b);padding:26px 28px;color:#ffffff;">
            <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.85;">GKK Interns</div>
            <h2 style="margin:8px 0 0 0;font-size:24px;line-height:1.2;">Payment Reminder</h2>
          </div>
          <div style="padding:28px;color:#0f172a;line-height:1.7;font-size:16px;">
            <p style="margin-top:0;">Dear <strong>${firstName}</strong>,</p>
            <p>This is a friendly reminder to complete your internship training payment so we can keep your application active.</p>
            <div style="margin:28px 0;">
              <a href="https://gkkintern.in/dashboard/user/login" style="display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;">Open Dashboard</a>
            </div>
            <div style="padding:16px 18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;color:#9a3412;font-size:14px;">
              If your payment is already complete, you can ignore this email.
            </div>
            <p style="margin-top:24px;">Best regards,<br><strong>GKK Hire Team</strong></p>
          </div>
        </div>
      </div>
    `;
  }

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: 'GKK Hire Team',
    noReply: true
  });

  // Keep an audit log for reminder sends.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Reminder Emails');
  if (!sheet) {
    sheet = ss.insertSheet('Reminder Emails');
    sheet.appendRow(['Timestamp', 'Source', 'Reminder Type', 'Application ID', 'Name', 'Email', 'Subject']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#1f2937').setFontColor('white');
  }
  sheet.appendRow([new Date(), source, reminderType, applicationId, recipientName, email, subject]);
  SpreadsheetApp.flush();

  return jsonResponse({ "status": "success", "action": "send_reminder_email" });
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup Instructions:
 * 1. Open a Google Spreadsheet.
 * 2. Extensions > Apps Script.
 * 3. Delete existing code and paste this.
 * 4. Deploy > New Deployment > Web App.
 * 5. Description: PANDAA Backend.
 * 6. Execute as: Me.
 * 7. Who has access: Anyone.
 * 8. Copy the Web App URL and add it to your .env files as VITE_CONTACT_SCRIPT_URL.
 */
