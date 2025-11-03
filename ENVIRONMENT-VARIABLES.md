# **Environment Variables Reference**

## **Required Environment Variables**

### **Firebase Configuration**
```env
# Firebase Project ID
FIREBASE_PROJECT_ID=chopchop-67750

# Service Account Private Key ID
FIREBASE_PRIVATE_KEY_ID=abcdef1234567890abcdef1234567890abcdef12

# Service Account Private Key (PEM format with newlines)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9UsTnTQ\nmGV7yMqF8V4J1Z1Bz4HnX8v0F4...\n-----END PRIVATE KEY-----\n"

# Service Account Email
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@chopchop-67750.iam.gserviceaccount.com

# Service Account Client ID
FIREBASE_CLIENT_ID=123456789012345678901

# Service Account Certificate URL
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40chopchop-67750.iam.gserviceaccount.com
```

### **Server Configuration**
```env
# Server Port (default: 4000)
PORT=4000

# Node Environment
NODE_ENV=development
```

## **How to Get Firebase Credentials**

### **Step 1: Access Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `chopchop-67750`

### **Step 2: Generate Service Account Key**
1. Click the ⚙️ gear icon → **Project Settings**
2. Go to **Service Accounts** tab
3. Click **"Generate new private key"**
4. Download the JSON file (e.g., `chopchop-67750-firebase-adminsdk-fbsvc-xxxxx.json`)

### **Step 3: Extract Values from JSON**
Open the downloaded JSON file and copy these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40chopchop-67750.iam.gserviceaccount.com"
}
```

### **Step 4: Create .env File**
Create a `.env` file in the `api` directory:

```env
FIREBASE_PROJECT_ID=chopchop-67750
FIREBASE_PRIVATE_KEY_ID=abcdef1234567890abcdef1234567890abcdef12
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9UsTnTQ\nmGV7yMqF8V4J1Z1Bz4HnX8v0F4...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@chopchop-67750.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40chopchop-67750.iam.gserviceaccount.com
PORT=4000
NODE_ENV=development
```

## **Security Notes**

### **🔐 Private Key Handling**
- **Never commit** `.env` files to version control
- **Store securely** in environment-specific secret management
- **Rotate regularly** service account keys
- **Limit permissions** to only required Firestore operations

### **🔒 Environment Separation**
```env
# Development
NODE_ENV=development
FIREBASE_PROJECT_ID=chopchop-dev-67750

# Staging
NODE_ENV=staging
FIREBASE_PROJECT_ID=chopchop-staging-67750

# Production
NODE_ENV=production
FIREBASE_PROJECT_ID=chopchop-67750
```

### **🚨 Critical Security**
- The `FIREBASE_PRIVATE_KEY` contains sensitive cryptographic material
- Use environment-specific service accounts
- Implement proper key rotation policies
- Monitor service account usage in Firebase Console

## **Validation**

### **Test Configuration**
```bash
# Test Firebase connection
node test-firebase.js

# Start server and check logs
npm start
```

### **Expected Startup Logs**
```
[dotenv@17.2.3] injecting env (7) from .env
Environment variables loaded:
FIREBASE_PROJECT_ID: chopchop-67750
FIREBASE_PRIVATE_KEY_ID: exists
FIREBASE_PRIVATE_KEY length: 1704
FIREBASE_CLIENT_EMAIL: firebase-adminsdk-fbsvc@chopchop-67750.iam.gserviceaccount.com
🚀 Firebase GraphQL API server ready at http://localhost:4000/graphql
```

## **Troubleshooting**

### **Common Issues**

#### **"private_key is undefined"**
- Check `.env` file exists in `api` directory
- Verify `FIREBASE_PRIVATE_KEY` is properly quoted
- Ensure newlines are preserved in the PEM key

#### **"Invalid service account credentials"**
- Regenerate service account key in Firebase Console
- Verify project ID matches exactly
- Check client_email format

#### **"Permission denied"**
- Ensure service account has Firestore access
- Check Firebase project permissions
- Verify Firestore is enabled in the project

### **Debug Commands**
```bash
# Check environment loading
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PROJECT_ID)"

# Test Firebase admin initialization
node -e "const admin = require('firebase-admin'); console.log('Firebase OK')"
```

---

**📋 Checklist:**
- [ ] Firebase project created
- [ ] Service account key generated
- [ ] `.env` file created with all variables
- [ ] Private key properly formatted with newlines
- [ ] Server starts without errors
- [ ] Firebase connection test passes