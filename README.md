# Food Delivery API - Firebase Backend

This is the Firebase-powered GraphQL API server for the ChopChop food delivery platform.

## Features

- **GraphQL API**: Apollo Server with GraphQL schema
- **Firebase Integration**: Firestore database for data persistence
- **Order Management**: Complete order placement and management system
- **Payment Method Support**: Handles CASH (immediate confirmation) and electronic payments (CARD/WALLET/BANK)
- **Order Status Tracking**: Complete order lifecycle with status history
- **Real-time Updates**: Status changes with timestamps and notes

## Setup

### 1. Get Firebase Service Account Credentials

**⚠️ IMPORTANT**: You need Firebase Admin SDK credentials, NOT the client-side config!

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `chopchop-67750`
3. Click the gear icon → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **"Generate new private key"**
6. Download the JSON file
7. Extract these values from the JSON:
   - `private_key_id`
   - `private_key` (the long PEM string)
   - `client_email`
   - `client_id`
   - `client_x509_cert_url`

8. Update your `.env` file with these values

### 2. Install dependencies:
   ```bash
   npm install
   ```

### 3. Configure Firebase:
   - Ensure Firebase project `chopchop-67750` exists
   - Firestore database should be enabled

### 4. Start the server:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

- **GraphQL Playground**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/.well-known/apollo/server-health`

## GraphQL Schema

### Mutations
- `placeOrder`: Place a new order with payment method handling
- `updateOrderStatus`: Update order status with history tracking

### Queries
- `orders`: Get all orders
- `order(id)`: Get a specific order by ID

## Payment Method Logic

- **CASH**: Order status set to `CONFIRMED` immediately
- **CARD/WALLET/BANK**: Order status set to `PENDING_PAYMENT` (requires payment processing)

## Environment Variables

```env
FIREBASE_PROJECT_ID=chopchop-67750
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@chopchop-67750.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
PORT=4000
```

## Documentation

### **For Developers**
- **[Developer Integration Guide](DEVELOPER-INTEGRATION-GUIDE.md)** - Complete setup, integration, and API reference
- **[Environment Variables](ENVIRONMENT-VARIABLES.md)** - Firebase credentials and configuration
- **[API Quick Reference](API-QUICK-REFERENCE.md)** - Fast lookup for GraphQL operations

### **For Users**
- **README.md** (this file) - Overview and quick start