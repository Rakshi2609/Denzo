import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Initializing Firebase Admin SDK...');

// Try to load from service account file first
const serviceAccountPath = join(__dirname, '../../serviceAccount.json');
try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin SDK initialized successfully (using serviceAccount.json)');
} catch (fileError) {
  console.log('📝 serviceAccount.json not found, trying environment variables...');
  
  // Fallback to environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || projectId === 'your_project_id') {
    console.error('\n❌ Firebase credentials not found!');
    console.error('\nOption 1: Create serviceAccount.json file');
    console.error('1. Download from: https://console.firebase.google.com/project/tasktapper/settings/serviceaccounts/adminsdk');
    console.error('2. Save as: server/serviceAccount.json');
    console.error('\nOption 2: Use environment variables in .env\n');
    process.exit(1);
  }

  if (!privateKey || privateKey.includes('Your Private Key Here')) {
    console.error('\n❌ FIREBASE_PRIVATE_KEY is not set properly in server/.env\n');
    process.exit(1);
  }

  if (!clientEmail || clientEmail.includes('xxxxx')) {
    console.error('\n❌ FIREBASE_CLIENT_EMAIL is not set properly in server/.env\n');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail,
    }),
  });

  console.log('✅ Firebase Admin SDK initialized successfully (using .env)');
}

export default admin;
