/**
 * PANDAA Contact Form Backend V1.0 - Google Apps Script
 * 
 * Features:
 * 1. Automatically creates/updates spreadsheet headers.
 * 2. Sends notification to admin.
 * 3. Sends auto-responder thank you email to the user.
 */

const ADMIN_EMAIL = "noreplay.gkk26@gmail.com";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { email, message, source, token, name } = data;
    
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
      Message: ${message}
      Token: ${token}
    `;
    MailApp.sendEmail(ADMIN_EMAIL, adminSubject, adminBody);
    
    // 4. Send User Auto-Responder
    const userSubject = "Thank you for contacting GKK INTERN";
    const userBody = `
      Hello ${name || "there"},
      
      Thank you for reaching out to GKK INTERN through our PANDAA Assistant. 
      We have received your message regarding:
      "${message.substring(0, 50)}..."
      
      Our team has been notified and we will connect with you soon.
      
      Best regards,
      The GKK Team
      Handcrafted by GKK
    `;
    MailApp.sendEmail(email, userSubject, userBody);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
