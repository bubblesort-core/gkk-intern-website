import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib import colors

def generate_pdf(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter,
                            rightMargin=50, leftMargin=50,
                            topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='CustomNormal', parent=styles['Normal'], spaceAfter=10, fontSize=10, leading=14))
    styles.add(ParagraphStyle(name='CustomHeading1', parent=styles['Heading1'], spaceAfter=14, textColor=colors.HexColor('#1E3A8A')))
    styles.add(ParagraphStyle(name='CustomHeading2', parent=styles['Heading2'], spaceAfter=10, textColor=colors.HexColor('#2563EB')))
    styles.add(ParagraphStyle(name='CodeItem', parent=styles['Normal'], fontName='Courier', fontSize=9, leftIndent=20, leading=12))
    styles.add(ParagraphStyle(name='CodeBlock', parent=styles['Normal'], fontName='Courier', fontSize=8, leftIndent=20, leading=10, backColor=colors.HexColor('#F3F4F6'), spaceBefore=10, spaceAfter=10, borderPadding=5))

    Story = []

    # Title
    Story.append(Paragraph("GKK Interns - Complete Admin & Operations Guide", styles['Title']))
    Story.append(Spacer(1, 20))

    # 1. Admin Section
    Story.append(Paragraph("1. Admin System Sections & Features", styles['CustomHeading1']))
    sections = [
        "<b>Active Interns:</b> Manage currently enrolled interns and their profiles.",
        "<b>Activity Logs:</b> Monitor actions taken within the system for audit purposes.",
        "<b>Announcements:</b> Broadcast messages and updates to interns.",
        "<b>Applications:</b> Review and accept/reject new internship applications.",
        "<b>Availability:</b> Set and manage administrator schedules and meeting slots.",
        "<b>Batches:</b> Organize interns into batches for streamlined coordination.",
        "<b>Custom Email:</b> Send tailored emails directly to individual or groups of interns.",
        "<b>Invitations:</b> Manage invite codes or direct invitations for new users.",
        "<b>Meetings:</b> Schedule and oversee video sessions and check-ins.",
        "<b>Payments:</b> Track intern payments, subscriptions, and verify unlocked features.",
        "<b>Projects:</b> Assign, track, and review project milestones.",
        "<b>Push Notifications:</b> Dispatch real-time mobile push notifications.",
        "<b>QR Codes:</b> Generate QR codes for quick mobile app access or attendance.",
        "<b>Resources:</b> Upload and manage learning materials and guides.",
        "<b>Rewards:</b> Issue certificates and manage the internal points system.",
        "<b>Submissions:</b> Evaluate intern project submissions and assignment uploads.",
        "<b>Teams:</b> Form and manage team collaborations and group projects."
    ]
    for section in sections:
        Story.append(Paragraph(f"• {section}", styles['CustomNormal']))

    Story.append(Spacer(1, 10))

    # 2. Infrastructure & Credentials
    Story.append(Paragraph("2. Critical Infrastructure & Credentials", styles['CustomHeading1']))

    Story.append(Paragraph("SMTP Email Configuration", styles['CustomHeading2']))
    Story.append(Paragraph("The primary automated email uses Nodemailer with a dedicated Gmail account:", styles['CustomNormal']))
    Story.append(Paragraph("<b>Email User:</b> noreplay.gkk26@gmail.com", styles['CodeItem']))
    Story.append(Paragraph("<b>App Password:</b> yutfmttgqvligqsm", styles['CodeItem']))

    Story.append(Paragraph("Payment Gateway (Razorpay Live)", styles['CustomHeading2']))
    Story.append(Paragraph("The platform is integrated with Razorpay for handling Rs. 499 application fees:", styles['CustomNormal']))
    Story.append(Paragraph("<b>Key ID:</b> rzp_live_SJUXJsWdw9cbj6", styles['CodeItem']))
    Story.append(Paragraph("<b>Key Secret:</b> daHrwJXUB7kWNq96cyuOYI63", styles['CodeItem']))

    Story.append(Paragraph("Supabase Edge Functions & Auth", styles['CustomHeading2']))
    Story.append(Paragraph("Project configuration for database and authentication integration:", styles['CustomNormal']))
    Story.append(Paragraph("<b>VITE_SUPABASE_URL:</b> https://hjpsyxqakzrhvzegehtm.supabase.co", styles['CodeItem']))
    Story.append(Paragraph("<b>VITE_SUPABASE_ANON_KEY:</b> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU", styles['CodeItem']))

    Story.append(Paragraph("Firebase Admin SDK (Mobile Push Notifications)", styles['CustomHeading2']))
    Story.append(Paragraph("Stored in <code>AdminMobileApp/service-account.json</code>:", styles['CustomNormal']))
    Story.append(Paragraph("<b>Project ID:</b> gkk-admin-app", styles['CodeItem']))
    Story.append(Paragraph("<b>Client Email:</b> firebase-adminsdk-fbsvc@gkk-admin-app.iam.gserviceaccount.com", styles['CodeItem']))
    Story.append(Paragraph("<b>Client ID:</b> 104526367320267631517", styles['CodeItem']))
    Story.append(Paragraph("<b>Private Key ID:</b> d963d11509316b6c9b7f31dfa1cf4a812eafdbdc", styles['CodeItem']))

    Story.append(Spacer(1, 10))

    # 3. Mobile App Deployment
    Story.append(Paragraph("3. Updating & Pushing Mobile Apps", styles['CustomHeading1']))
    Story.append(Paragraph("Mobile releases are automated via Node.js scripts handling the GitHub Releases API.", styles['CustomNormal']))
    
    Story.append(Paragraph("Deployment Process:", styles['CustomHeading2']))
    steps1 = [
        "1. Update the version number in <code>app_config.json</code> under the respective app directory (AdminMobileApp / InternMobileApp).",
        "2. Build the Android APK using Flutter:<br/><code>flutter build apk --release</code>",
        "3. Wait for the build to create the APK at <code>build/app/outputs/flutter-apk/app-release.apk</code>.",
        "4. Run the release automation script:<br/><code>node release_github.js</code>",
        "5. The APK will be uploaded to GitHub releases automatically."
    ]
    for step in steps1:
        Story.append(Paragraph(step, styles['CustomNormal']))

    Story.append(Paragraph("release_github.js (Admin Release Script):", styles['CustomHeading2']))
    release_github_code = '''import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';

// 1. GitHub Repository Info (admin-specific private repo)
const OWNER = 'noreplaygkk26-png';
const REPO = 'gkk-admin-releases';

// 2. GitHub Personal Access Token (PAT)
const GITHUB_TOKEN = 'REDACTED';

// 3. File Paths
const APP_CONFIG_PATH = './app_config.json';
const APK_PATH = './build/app/outputs/flutter-apk/app-release.apk';

async function createRelease() {
    try {
        const appConfig = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf8'));
        const tagName = `admin-v${appConfig.latest_version}`;
        const releaseName = `Admin Release ${appConfig.latest_version} (Build ${appConfig.required_build_number})`;
        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        const { data: release } = await octokit.rest.repos.createRelease({
            owner: OWNER, repo: REPO, tag_name: tagName, name: releaseName,
            body: `Admin app release v${appConfig.latest_version}.`,
            draft: false, prerelease: false,
        });

        const fileName = path.basename(APK_PATH);
        const fileContent = fs.readFileSync(APK_PATH);
        await octokit.rest.repos.uploadReleaseAsset({
            owner: OWNER, repo: REPO, release_id: release.id,
            name: fileName, data: fileContent,
            headers: { 'content-type': 'application/vnd.android.package-archive', 'content-length': fileContent.length },
        });
        console.log(`Release created: ${release.html_url}`);
    } catch (error) {
        console.error('Release failed:', error.message);
    }
}
createRelease();'''
    Story.append(Paragraph(release_github_code.replace('\\n', '<br/>').replace(' ', '&nbsp;'), styles['CodeBlock']))


    Story.append(Spacer(1, 10))

    # 4. Web Deployment
    Story.append(Paragraph("4. Production Deployment for Websites", styles['CustomHeading1']))
    Story.append(Paragraph("Web deployment consolidates four React apps into a single structure for Netlify.", styles['CustomNormal']))
    
    Story.append(Paragraph("Web Deployment Steps:", styles['CustomHeading2']))
    steps2 = [
        "1. Open the terminal in the root project directory (root folder).",
        "2. Run the deployment batch file: <code>deploy.bat</code>",
        "3. Wait for it to build Bento Form, Dashboard, GKK-HIRE-MAIN, and Community Chat into <code>production_dist</code>.",
        "4. Deploy the folder to Netlify using the CLI: <code>netlify deploy --prod</code>",
        "5. Select <code>production_dist</code> as the publish directory when prompted."
    ]
    for step in steps2:
        Story.append(Paragraph(step, styles['CustomNormal']))

    Story.append(Paragraph("deploy.bat (Web Deployment Script):", styles['CustomHeading2']))
    deploy_bat_code = '''@echo off
setlocal enabledelayedexpansion
set ROOT=%~dp0
pushd "%ROOT%"

if exist "production_dist" ( rmdir /s /q "production_dist" )
mkdir "production_dist"

pushd "gkk-bento-form" & call npm run build & popd
pushd "Dashboard" & call npm run build & popd
pushd "GKK-HIRE-MAIN" & call npm run build & popd
pushd "community-chat" & call npm run build & popd

robocopy "GKK-HIRE-MAIN\\dist" "production_dist" /E /NFL /NDL /NJH /NJS /NC /NS >nul
mkdir "production_dist\\dashboard"
robocopy "Dashboard\\dist" "production_dist\\dashboard" /E /NFL /NDL /NJH /NJS /NC /NS >nul

robocopy "production_dist\\dashboard\\admin" "production_dist\\admin" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul
robocopy "production_dist\\dashboard\\css" "production_dist\\css" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul
robocopy "production_dist\\dashboard\\js" "production_dist\\js" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul
robocopy "production_dist\\dashboard\\user" "production_dist\\user" /E /MOVE /NFL /NDL /NJH /NJS /NC /NS >nul
robocopy "production_dist\\dashboard\\assets" "production_dist\\assets" "gkk-intern-logo.png" "bubblesort-logo.png" /NFL /NDL /NJH /NJS /NC /NS >nul

mkdir "production_dist\\dashboard\\apply"
robocopy "gkk-bento-form\\dist" "production_dist\\dashboard\\apply" /E /NFL /NDL /NJH /NJS /NC /NS >nul
mkdir "production_dist\\community-chat"
robocopy "community-chat\\dist" "production_dist\\community-chat" /E /NFL /NDL /NJH /NJS /NC /NS >nul

(
echo /supabase-main/*  https://hjpsyxqakzrhvzegehtm.supabase.co/:splat  200!
echo /supabase-chat/*  https://mwnpwuxrbaousgwgoyco.supabase.co/:splat  200!
echo /dashboard/admin/*  /admin/:splat  301
echo /dashboard/css/*    /css/:splat    301
echo /dashboard/js/*     /js/:splat     301
echo /dashboard/apply/*  /dashboard/apply/index.html  200
echo /Dashboard/*        /dashboard/:splat        301
echo /dashboard/*        /dashboard/index.html        200
echo /community-chat/*   /community-chat/index.html   200
echo /*                  /index.html                  200
) > "production_dist\\_redirects"
popd
'''
    Story.append(Paragraph(deploy_bat_code.replace('\\n', '<br/>').replace(' ', '&nbsp;'), styles['CodeBlock']))


    Story.append(Spacer(1, 10))

    # 5. Supabase Edge Functions Deployment
    Story.append(Paragraph("5. Deploying Supabase Edge Functions", styles['CustomHeading1']))
    Story.append(Paragraph("Edge functions are handled by a separate deployment batch script.", styles['CustomNormal']))

    Story.append(Paragraph("deploy_functions.bat (Snippet):", styles['CustomHeading2']))
    deploy_fns_code = '''@echo off
setlocal
echo Deploying Supabase Edge Functions...
pushd "%~dp0"

call supabase functions deploy create-profile --no-verify-jwt
call supabase functions deploy send-otp --no-verify-jwt
call supabase functions deploy send-decision-email --no-verify-jwt
call supabase functions deploy send-application-email --no-verify-jwt
call supabase functions deploy initiate-payment --no-verify-jwt
call supabase functions deploy razorpay-order --no-verify-jwt
call supabase functions deploy razorpay-webhook --no-verify-jwt

echo CRITICAL: YOU MUST CONFIGURE THE HOOK IN SUPABASE DASHBOARD
echo 1. Go to Authentication -> Hooks
echo 2. Enable "Send Email Hook" (or "Custom Email Provider")
echo 3. Select "Function" -> "send-otp"
echo    (Or paste the URL: https://<project-ref>.supabase.co/functions/v1/send-otp)
echo 4. Save
echo Also ensure Razorpay webhook is configured to:
echo https://<project-ref>.supabase.co/functions/v1/razorpay-webhook

popd
endlocal
'''
    Story.append(Paragraph(deploy_fns_code.replace('\\n', '<br/>').replace(' ', '&nbsp;'), styles['CodeBlock']))

    doc.build(Story)
    print(f"PDF generated successfully at: {output_path}")

if __name__ == "__main__":
    generate_pdf("gkk_guide.pdf")
