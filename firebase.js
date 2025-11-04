require('dotenv').config();
const admin = require('firebase-admin');

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID ? 'exists' : 'missing');
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 0);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);

// Check if running in CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

console.log('\nEnvironment check:');
console.log('- CI Environment:', isCI);
console.log('- Valid credentials:', !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL));

// Initialize Firebase Admin
try {
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: 'googleapis.com',
  };

  console.log('Initializing Firebase with credentials...');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  if (!isCI) {
    throw error;
  }
}

// Check for secondary Firebase configuration
if (process.env.SECONDARY_FIREBASE_PROJECT_ID && 
    process.env.SECONDARY_FIREBASE_PRIVATE_KEY && 
    process.env.SECONDARY_FIREBASE_CLIENT_EMAIL) {
  console.log('ℹ️ Secondary Firebase configuration detected');
} else {
  console.log('ℹ️ Secondary Firebase not configured (set SECONDARY_FIREBASE_* to enable)');
}

const db = admin.firestore();

module.exports = { admin, db };
