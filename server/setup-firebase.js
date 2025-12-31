// Run this script after downloading your Firebase Admin SDK JSON file
// Usage: node setup-firebase.js path/to/serviceAccountKey.json

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('\n❌ Please provide the path to your Firebase service account JSON file');
  console.log('\nUsage: node setup-firebase.js path/to/serviceAccountKey.json');
  console.log('\nTo get this file:');
  console.log('1. Go to https://console.firebase.google.com/project/task-manager-2b634/settings/serviceaccounts/adminsdk');
  console.log('2. Click "Generate new private key"');
  console.log('3. Download the JSON file');
  console.log('4. Run: node setup-firebase.js path/to/downloaded-file.json\n');
  process.exit(1);
}

try {
  const jsonPath = args[0];
  const serviceAccount = JSON.parse(readFileSync(jsonPath, 'utf8'));

  // Read current .env file
  const envPath = join(__dirname, '.env');
  let envContent = readFileSync(envPath, 'utf8');

  // Update the Firebase credentials
  envContent = envContent.replace(
    /FIREBASE_PROJECT_ID=.*/,
    `FIREBASE_PROJECT_ID=${serviceAccount.project_id}`
  );
  envContent = envContent.replace(
    /FIREBASE_PRIVATE_KEY=.*/,
    `FIREBASE_PRIVATE_KEY="${serviceAccount.private_key.replace(/\n/g, '\\n')}"`
  );
  envContent = envContent.replace(
    /FIREBASE_CLIENT_EMAIL=.*/,
    `FIREBASE_CLIENT_EMAIL=${serviceAccount.client_email}`
  );

  // Write back to .env
  writeFileSync(envPath, envContent);

  console.log('\n✅ Firebase Admin SDK credentials updated successfully!');
  console.log('\nYou can now start the server with: npm run dev\n');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
