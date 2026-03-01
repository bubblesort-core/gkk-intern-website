# GKK Interns - Complete Admin & Operations Guide

Welcome to the GKK Interns platform repository. This system provides a comprehensive suite of tools for managing interns, tracking their progress, handling payments, and facilitating communication.

## 1. Admin System Sections & Features

*   **Active Interns**: Manage currently enrolled interns and their profiles.
*   **Activity Logs**: Monitor actions taken within the system for audit purposes.
*   **Announcements**: Broadcast messages and updates to interns.
*   **Applications**: Review and accept/reject new internship applications.
*   **Availability**: Set and manage administrator schedules and meeting slots.
*   **Batches**: Organize interns into batches for streamlined coordination.
*   **Custom Email**: Send tailored emails directly to individual or groups of interns.
*   **Invitations**: Manage invite codes or direct invitations for new users.
*   **Meetings**: Schedule and oversee video sessions and check-ins.
*   **Payments**: Track intern payments, subscriptions, and verify unlocked features.
*   **Projects**: Assign, track, and review project milestones.
*   **Push Notifications**: Dispatch real-time mobile push notifications.
*   **QR Codes**: Generate QR codes for quick mobile app access or attendance.
*   **Resources**: Upload and manage learning materials and guides.
*   **Rewards**: Issue certificates and manage the internal points system.
*   **Submissions**: Evaluate intern project submissions and assignment uploads.
*   **Teams**: Form and manage team collaborations and group projects.

## 2. Critical Infrastructure & Credentials

*Note: For security reasons, actual passwords, secrets, and keys should be managed via environment variables and not hardcoded.*

### SMTP Email Configuration
The primary automated email uses Nodemailer with a dedicated Gmail account.
*   **Email User**: `noreplay.gkk26@gmail.com`

### Payment Gateway (Razorpay Live)
The platform is integrated with Razorpay for handling Rs. 499 application fees.

### Supabase Edge Functions & Auth
Project configuration for database and authentication integration.
*   **VITE_SUPABASE_URL**: `https://hjpsyxqakzrhvzegehtm.supabase.co`

### Firebase Admin SDK (Mobile Push Notifications)
Stored in `AdminMobileApp/service-account.json`.
*   **Project ID**: `gkk-admin-app`
*   **Client Email**: `firebase-adminsdk-fbsvc@gkk-admin-app.iam.gserviceaccount.com`

---

## 3. Updating & Pushing Mobile Apps

Mobile releases are automated via Node.js scripts handling the GitHub Releases API.

### Deployment Process:
1.  Update the version number in `app_config.json` under the respective app directory (`AdminMobileApp` / `InternMobileApp`).
2.  Build the Android APK using Flutter:
    ```bash
    flutter build apk --release
    ```
3.  Wait for the build to create the APK at `build/app/outputs/flutter-apk/app-release.apk`.
4.  Run the release automation script:
    ```bash
    node release_github.js
    ```
5.  The APK will be uploaded to GitHub releases automatically.

---

## 4. Production Deployment for Websites

Web deployment consolidates four React apps into a single structure for Netlify.

### Web Deployment Steps:
1.  Open the terminal in the root project directory (root folder).
2.  Run the deployment batch file: `deploy.bat`
3.  Wait for it to build Bento Form, Dashboard, GKK-HIRE-MAIN, and Community Chat into `production_dist`.
4.  Deploy the folder to Netlify using the CLI:
    ```bash
    netlify deploy --prod
    ```
5.  Select `production_dist` as the publish directory when prompted.

---

## 5. Deploying Supabase Edge Functions

Edge functions are handled by a separate deployment batch script `deploy_functions.bat`.

### Configuration Steps:
1.  **CRITICAL:** You must configure the hook in the Supabase Dashboard.
2.  Go to **Authentication** -> **Hooks**.
3.  Enable "Send Email Hook" (or "Custom Email Provider").
4.  Select "Function" -> "send-otp" (Or paste the URL: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/send-otp`).
5.  Save.
6.  Ensure Razorpay webhook is configured to: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/razorpay-webhook`
