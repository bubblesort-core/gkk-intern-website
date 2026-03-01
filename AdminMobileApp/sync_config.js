import fs from 'fs';
import admin from 'firebase-admin';

// =============================================================================
// CONFIGURATION
// =============================================================================

// 1. Path to your Firebase Service Account JSON file
// Download from Firebase Console -> Project Settings -> Service Accounts
// NOTE: Use the ADMIN app's Firebase project service account, not the intern one!
const SERVICE_ACCOUNT_PATH = './service-account.json';

// 2. Path to your local app config
const APP_CONFIG_PATH = './app_config.json';

// =============================================================================
// SYNC LOGIC — Admin-specific Remote Config keys
// =============================================================================

async function syncConfig() {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error('❌ Error: Service account file not found at ' + SERVICE_ACCOUNT_PATH);
        console.log('Download it from your ADMIN Firebase project -> Project Settings -> Service Accounts');
        return;
    }

    try {
        const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
        const appConfig = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('🚀 Pushing admin config to Firebase Remote Config...');
        console.log(`- admin_required_build_number: ${appConfig.required_build_number}`);
        console.log(`- admin_latest_version: ${appConfig.latest_version}`);
        console.log(`- admin_update_url: ${appConfig.update_url}`);

        const remoteConfig = admin.remoteConfig();
        const template = await remoteConfig.getTemplate();

        // Admin-specific Remote Config keys (match UpdateService constants)
        template.parameters['admin_required_build_number'] = {
            defaultValue: { value: appConfig.required_build_number.toString() },
            valueType: 'NUMBER'
        };
        template.parameters['admin_latest_version'] = {
            defaultValue: { value: appConfig.latest_version.toString() },
            valueType: 'STRING'
        };
        template.parameters['admin_update_url'] = {
            defaultValue: { value: appConfig.update_url.toString() },
            valueType: 'STRING'
        };

        await remoteConfig.validateTemplate(template);
        await remoteConfig.publishTemplate(template);

        console.log('✅ Successfully synced admin config to Firebase!');
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    }
}

syncConfig();
