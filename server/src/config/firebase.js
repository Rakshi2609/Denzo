import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Initializing Firebase Admin SDK...');

// Initialize from environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (!projectId || !privateKey || !clientEmail) {
  console.error('❌ Firebase configuration missing!');
  console.error('Required environment variables:');
  console.error('- FIREBASE_PROJECT_ID');
  console.error('- FIREBASE_PRIVATE_KEY');
  console.error('- FIREBASE_CLIENT_EMAIL');
  throw new Error('Firebase Admin SDK initialization failed - missing credentials');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      // Handle both multiline and escaped \n format
      privateKey: privateKey.includes('\\n') 
        ? privateKey.replace(/\\n/g, '\n')
        : privateKey,
      clientEmail,
    }),
  });
  console.log('✅ Firebase Admin SDK initialized successfully from environment variables');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error.message);
  throw error;
}

export default admin;
