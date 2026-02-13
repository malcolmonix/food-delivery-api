/**
 * Test script for the delayOrderPickup mutation
 * 
 * Usage:
 *   node test-delay-order.js
 * 
 * Prerequisites:
 *   - API server must be running (npm run dev)
 *   - Must have a valid order ID
 *   - Must have Firebase auth token for restaurant owner
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000/graphql';

// Test configuration
const TEST_CONFIG = {
  orderId: 'ORDER-1707577200000', // Replace with actual order ID
  delayMinutes: 15,
  reason: 'High order volume - testing delay feature',
  authToken: '', // Add Firebase auth token here
};

const DELAY_ORDER_MUTATION = `
  mutation DelayOrderPickup($orderId: ID!, $delayMinutes: Int!, $reason: String) {
    delayOrderPickup(orderId: $orderId, delayMinutes: $delayMinutes, reason: $reason) {
      id
      orderId
      userId
      restaurant
      orderStatus
      expectedTime
      orderDate
      statusHistory {
        status
        timestamp
        note
      }
      updatedAt
    }
  }
`;

async function testDelayOrder() {
  console.log('🧪 Testing delayOrderPickup mutation...\n');

  if (!TEST_CONFIG.authToken) {
    console.error('❌ Error: AUTH_TOKEN not set');
    console.log('Please set your Firebase auth token in TEST_CONFIG.authToken');
    process.exit(1);
  }

  try {
    console.log('📋 Test Configuration:');
    console.log(`   Order ID: ${TEST_CONFIG.orderId}`);
    console.log(`   Delay: ${TEST_CONFIG.delayMinutes} minutes`);
    console.log(`   Reason: ${TEST_CONFIG.reason}\n`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
      },
      body: JSON.stringify({
        query: DELAY_ORDER_MUTATION,
        variables: {
          orderId: TEST_CONFIG.orderId,
          delayMinutes: TEST_CONFIG.delayMinutes,
          reason: TEST_CONFIG.reason,
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('❌ GraphQL Errors:');
      result.errors.forEach((error, index) => {
        console.error(`\n   Error ${index + 1}:`);
        console.error(`   Message: ${error.message}`);
        if (error.extensions) {
          console.error(`   Code: ${error.extensions.code}`);
        }
        if (error.path) {
          console.error(`   Path: ${error.path.join(' → ')}`);
        }
      });
      process.exit(1);
    }

    if (result.data && result.data.delayOrderPickup) {
      const order = result.data.delayOrderPickup;
      console.log('✅ Order delayed successfully!\n');
      console.log('📦 Updated Order Details:');
      console.log(`   Order ID: ${order.orderId}`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Original Time: ${order.orderDate}`);
      console.log(`   New Expected Time: ${order.expectedTime}`);
      console.log(`   Updated At: ${order.updatedAt}\n`);

      console.log('📜 Status History:');
      order.statusHistory.forEach((entry, index) => {
        console.log(`\n   ${index + 1}. ${entry.status}`);
        console.log(`      Time: ${entry.timestamp}`);
        if (entry.note) {
          console.log(`      Note: ${entry.note}`);
        }
      });

      // Calculate actual delay
      const originalTime = new Date(order.orderDate);
      const newTime = new Date(order.expectedTime);
      const actualDelay = Math.round((newTime - originalTime) / 60000);
      console.log(`\n⏰ Actual Delay Applied: ${actualDelay} minutes`);

      console.log('\n✅ Test completed successfully!');
      console.log('\n📱 Next Steps:');
      console.log('   1. Check customer received push notification');
      console.log('   2. Check rider received push notification');
      console.log('   3. Verify Firestore sync');
      console.log('   4. Check ChopChop app shows updated ETA');
      console.log('   5. Check RiderMi app shows updated pickup time');
    } else {
      console.error('❌ Unexpected response format');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Test validation scenarios
async function testValidation() {
  console.log('\n🧪 Testing validation scenarios...\n');

  const validationTests = [
    {
      name: 'Delay too short (4 minutes)',
      variables: { orderId: TEST_CONFIG.orderId, delayMinutes: 4, reason: 'Test' },
      expectedError: 'Delay must be between 5 and 30 minutes',
    },
    {
      name: 'Delay too long (31 minutes)',
      variables: { orderId: TEST_CONFIG.orderId, delayMinutes: 31, reason: 'Test' },
      expectedError: 'Delay must be between 5 and 30 minutes',
    },
    {
      name: 'Invalid order ID',
      variables: { orderId: 'INVALID-ORDER', delayMinutes: 10, reason: 'Test' },
      expectedError: 'Order not found',
    },
  ];

  for (const test of validationTests) {
    console.log(`Testing: ${test.name}`);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        },
        body: JSON.stringify({
          query: DELAY_ORDER_MUTATION,
          variables: test.variables,
        }),
      });

      const result = await response.json();

      if (result.errors && result.errors[0].message.includes(test.expectedError)) {
        console.log(`   ✅ Correctly rejected: ${result.errors[0].message}\n`);
      } else {
        console.log(`   ❌ Unexpected result\n`);
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}\n`);
    }
  }
}

// Run tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Delay Order Pickup - Feature Test');
  console.log('═══════════════════════════════════════════════════════\n');

  // Main test
  await testDelayOrder();

  // Validation tests (optional)
  const runValidation = process.argv.includes('--validate');
  if (runValidation) {
    await testValidation();
  } else {
    console.log('\n💡 Tip: Run with --validate flag to test validation scenarios');
  }

  console.log('\n═══════════════════════════════════════════════════════');
}

runTests().catch(console.error);
