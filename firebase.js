require('dotenv').config();

console.log('Environment variables loaded:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID ? 'exists' : 'missing');
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 'missing');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);

const admin = require('firebase-admin');

// Check if we're in a CI environment or missing credentials
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const hasValidCredentials = process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PROJECT_ID;

console.log('Environment check:');
console.log('- CI Environment:', isCI);
console.log('- Valid credentials:', hasValidCredentials);

let admin_instance = null;
let db = null;
let bucket = null;

if (hasValidCredentials) {
  // Initialize Firebase Admin SDK with real credentials
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "chopchop-67750",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com"
  };

  console.log('Initializing Firebase with credentials...');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
  }

  admin_instance = admin;
  db = admin.firestore();

  // Initialize Storage bucket
  try {
    bucket = admin.storage().bucket(`${serviceAccount.project_id}.appspot.com`);
    console.log('✅ Firebase initialized successfully with Storage');
  } catch (error) {
    console.warn('⚠️  Firebase Storage initialization failed:', error.message);
    console.log('✅ Firebase initialized successfully (without Storage)');
  }
  doc: () => ({
    get: async () => ({ exists: false, data: () => null }),
    set: async () => ({ writeTime: new Date() }),
    update: async () => ({ writeTime: new Date() }),
    delete: async () => ({ writeTime: new Date() })
  }),
    add: async () => ({ id: 'mock-id' }),
      where: () => ({
        where: () => ({ get: async () => ({ empty: true, docs: [] }) }),
        get: async () => ({ empty: true, docs: [] })
      }),
        get: async () => ({ empty: true, docs: [] })
})
  };

// Mock bucket for environments without storage
bucket = null;
}

module.exports = { admin: admin_instance, db, bucket };