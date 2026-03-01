import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';

// =============================================================================
// CONFIGURATION
// =============================================================================

// 1. GitHub Repository Info (admin-specific private repo)
const OWNER = 'noreplaygkk26-png';
const REPO = 'gkk-admin-releases';

// 2. GitHub Personal Access Token (PAT)
// Create one at https://github.com/settings/tokens
const GITHUB_TOKEN = 'REDACTED';

// 3. File Paths
const APP_CONFIG_PATH = './app_config.json';
const APK_PATH = './build/app/outputs/flutter-apk/app-release.apk';

// =============================================================================
// RELEASE LOGIC
// =============================================================================

async function createRelease() {
    if (GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN') {
        console.error('❌ Error: GitHub Token not configured.');
        console.log('Please update the GITHUB_TOKEN in release_github.js');
        return;
    }

    try {
        const appConfig = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf8'));
        const tagName = `admin-v${appConfig.latest_version}`;
        const releaseName = `Admin Release ${appConfig.latest_version} (Build ${appConfig.required_build_number})`;

        console.log(`🚀 Preparing Admin GitHub Release: ${tagName}...`);

        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        // 1. Create the Release
        const { data: release } = await octokit.rest.repos.createRelease({
            owner: OWNER,
            repo: REPO,
            tag_name: tagName,
            name: releaseName,
            body: `Admin app release v${appConfig.latest_version}.\n\nDownload the APK attached below.`,
            draft: false,
            prerelease: false,
        });

        console.log(`✅ Release created: ${release.html_url}`);

        // 2. Upload the APK
        const fileName = path.basename(APK_PATH);
        const fileContent = fs.readFileSync(APK_PATH);

        console.log(`⬆️ Uploading ${fileName}...`);

        await octokit.rest.repos.uploadReleaseAsset({
            owner: OWNER,
            repo: REPO,
            release_id: release.id,
            name: fileName,
            data: fileContent,
            headers: {
                'content-type': 'application/vnd.android.package-archive',
                'content-length': fileContent.length,
            },
        });

        console.log(`✅ ${fileName} uploaded successfully!`);
        console.log(`🔗 Link: ${release.html_url}`);

    } catch (error) {
        console.error('❌ Release failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

createRelease();
