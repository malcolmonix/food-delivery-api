/**
 * MenuVerse E2E Integration Test Suite
 * 
 * Tests the complete integration between MenuVerse frontend and ChopChop API
 * including vendor authentication, order queries, and status updates via webhooks.
 * 
 * Prerequisites:
 * - API server running on localhost:4000
 * - Firebase configured with proper credentials
 * - Valid vendor account in Firebase (Malcolm Etuk: 0GI3MojVnLfvzSEqMc25oCzAmCz2)
 */

const axios = require('axios');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: "https://accounts.google.com/o/oauth2/auth",
      tokenUri: "https://oauth2.googleapis.com/token",
      authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
      clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL
    })
  });
}

// Configuration
const API_URL = 'http://localhost:4000/graphql';
const VENDOR_UID = '0GI3MojVnLfvzSEqMc25oCzAmCz2'; // Malcolm Etuk
const VENDOR_EMAIL = 'malcolmetuk00@gmail.com';
const FIREBASE_API_KEY = 'AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q'; // From MenuVerse config

// Test Results Tracker
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Test Helper Functions
function logTest(name, passed, message) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ PASS: ${name}`);
  } else {
    results.failed++;
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${message}`);
  }
  results.tests.push({ name, passed, message });
}

async function generateVendorToken() {
  try {
    const customToken = await admin.auth().createCustomToken(VENDOR_UID, {
      role: 'vendor',
      email: VENDOR_EMAIL
    });
    
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Token generation failed');
    }
    
    return data.idToken;
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
}

async function makeGraphQLRequest(query, variables = {}, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(
      API_URL,
      { query, variables },
      { headers }
    );
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.errors?.[0]?.message || error.message);
    }
    throw error;
  }
}

// Test Suite
async function runTests() {
  console.log('\n🧪 MenuVerse E2E Integration Test Suite');
  console.log('═══════════════════════════════════════\n');
  
  let vendorToken = null;
  let testOrderId = null;
  let originalStatus = null;
  
  try {
    // Test 1: Firebase Admin SDK Initialization
    console.log('\n📋 Test 1: Firebase Admin SDK');
    try {
      const app = admin.app();
      logTest(
        'Firebase Admin initialized',
        true,
        `Project: ${app.options.projectId}`
      );
    } catch (error) {
      logTest(
        'Firebase Admin initialized',
        false,
        error.message
      );
      throw new Error('Cannot proceed without Firebase');
    }
    
    // Test 2: Vendor Token Generation
    console.log('\n📋 Test 2: Vendor Authentication');
    try {
      vendorToken = await generateVendorToken();
      logTest(
        'Generate vendor authentication token',
        vendorToken && vendorToken.length > 100,
        `Token length: ${vendorToken.length}`
      );
    } catch (error) {
      logTest(
        'Generate vendor authentication token',
        false,
        error.message
      );
      throw new Error('Cannot proceed without authentication');
    }
    
    // Test 3: Query Vendor Orders
    console.log('\n📋 Test 3: Query Vendor Orders');
    const vendorOrdersQuery = `
      query VendorOrders {
        vendorOrders {
          orderId
          userId
          restaurant
          orderStatus
          orderAmount
          orderDate
          deliveryCharges
          paymentMethod
          address
          orderItems {
            title
            quantity
            price
          }
        }
      }
    `;
    
    try {
      const data = await makeGraphQLRequest(
        vendorOrdersQuery,
        {},
        vendorToken
      );
      
      const orders = data.vendorOrders || [];
      logTest(
        'Fetch vendor orders',
        orders.length > 0,
        `Retrieved ${orders.length} orders`
      );
      
        // Validate order structure
        if (orders.length > 0) {
          const firstOrder = orders[0];
          const hasRequiredFields = 
            firstOrder.orderId &&
            firstOrder.orderStatus &&
            firstOrder.orderAmount !== undefined &&
            firstOrder.orderDate;
          
          logTest(
            'Order contains required fields',
            hasRequiredFields,
            `Order ID: ${firstOrder.orderId}, Status: ${firstOrder.orderStatus}`
          );        // Validate timestamp format (ISO string)
        const isValidISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(firstOrder.orderDate);
        logTest(
          'Order date in ISO format',
          isValidISO,
          `Format: ${firstOrder.orderDate}`
        );
        
        // Select test order - prefer orders with testable status
        const testableStatuses = ['Pending', 'PENDING', 'CONFIRMED', 'PREPARING'];
        const testableOrder = orders.find(o => testableStatuses.includes(o.orderStatus)) || firstOrder;
        testOrderId = testableOrder.orderId;
        originalStatus = testableOrder.orderStatus;
        
        console.log(`\n🎯 Selected test order: ${testOrderId} (Status: ${originalStatus})`);
      }
    } catch (error) {
      logTest(
        'Fetch vendor orders',
        false,
        error.message
      );
    }
    
    // Test 4: Webhook Order Status Update
    if (testOrderId && originalStatus) {
      console.log('\n📋 Test 4: Webhook Order Status Update');
      
      const updateMutation = `
        mutation UpdateOrderStatus($orderId: ID!, $newStatus: String!) {
          webhookMenuVerseOrderUpdate(orderId: $orderId, newStatus: $newStatus) {
            success
            message
            order {
              orderId
              orderStatus
            }
          }
        }
      `;
      
      // Determine new status for test
      const statusMap = {
        'Pending': 'CONFIRMED',
        'PENDING': 'CONFIRMED',
        'CONFIRMED': 'PREPARING',
        'PREPARING': 'ON_THE_WAY'
      };
      const newStatus = statusMap[originalStatus] || 'PREPARING';
      
      console.log(`📝 Updating status: ${originalStatus} → ${newStatus}\n`);
      
      try {
        const data = await makeGraphQLRequest(
          updateMutation,
          { orderId: testOrderId, newStatus },
          vendorToken
        );
        
        const result = data.webhookMenuVerseOrderUpdate;
        logTest(
          'Execute status update mutation',
          result && result.success === true,
          result ? result.message : 'No response'
        );
        
        logTest(
          'Status update returns correct data',
          result.order && result.order.orderId === testOrderId && result.order.orderStatus === newStatus,
          result.order ? `Order: ${result.order.orderId}, New Status: ${result.order.orderStatus}` : 'No order in response'
        );
      } catch (error) {
        logTest(
          'Execute status update mutation',
          false,
          error.message
        );
      }
      
      // Test 5: Verify Status Update in Firestore
      console.log('\n📋 Test 5: Verify Firestore Persistence');
      
      try {
        // Wait for async Firestore write to complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check vendor-specific collection first (primary location)
        const vendorOrderRef = admin.firestore()
          .collection('eateries')
          .doc(VENDOR_UID)
          .collection('orders')
          .doc(testOrderId);
        
        const vendorOrderDoc = await vendorOrderRef.get();
        
        let foundInVendor = false;
        let foundInMain = false;
        let persistedStatus = null;
        
        if (vendorOrderDoc.exists) {
          foundInVendor = true;
          const data = vendorOrderDoc.data();
          persistedStatus = data.status || data.orderStatus;
        }
        
        // Check main orders collection as fallback
        if (!foundInVendor) {
          const orderRef = admin.firestore().collection('orders').doc(testOrderId);
          const orderDoc = await orderRef.get();
          
          if (orderDoc.exists) {
            foundInMain = true;
            const data = orderDoc.data();
            persistedStatus = data.orderStatus || data.status;
          }
        }
        
        logTest(
          'Order exists in Firestore',
          foundInMain || foundInVendor,
          `Vendor collection: ${foundInVendor}, Main collection: ${foundInMain}`
        );
        
        if (foundInMain || foundInVendor) {
          logTest(
            'Status persisted correctly',
            persistedStatus === newStatus,
            `Expected: ${newStatus}, Found: ${persistedStatus}`
          );
        } else {
          logTest(
            'Status persisted correctly',
            false,
            `Order ${testOrderId} not found in Firestore`
          );
        }
        
      } catch (error) {
        logTest(
          'Verify Firestore persistence',
          false,
          error.message
        );
      }
      
      // Test 6: Requery to Verify Client-Side Update
      console.log('\n📋 Test 6: Client-Side Verification');
      
      try {
        const data = await makeGraphQLRequest(
          vendorOrdersQuery,
          {},
          vendorToken
        );
        
        const updatedOrder = data.vendorOrders.find(o => o.orderId === testOrderId);
        
        logTest(
          'Updated order appears in query results',
          updatedOrder !== undefined,
          `Order ${testOrderId} found`
        );
        
        if (updatedOrder) {
          logTest(
            'Query returns updated status',
            updatedOrder.orderStatus === newStatus,
            `Expected: ${newStatus}, Got: ${updatedOrder.orderStatus}`
          );
        }
      } catch (error) {
        logTest(
          'Client-side verification query',
          false,
          error.message
        );
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test suite halted:', error.message);
  }
  
  // Print Summary
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════\n');
  
  // Exit with appropriate code
  if (results.failed > 0) {
    console.error('❌ Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed successfully!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
