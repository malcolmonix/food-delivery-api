#!/usr/bin/env node

/**
 * Test Order Sync between MenuVerse and ChopChop
 * This script demonstrates how to sync order status from MenuVerse to ChopChop
 */

const http = require('http');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:4000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // Get this from your authentication

// Helper function to make GraphQL requests
async function graphqlRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query,
      variables
    });

    const options = {
      hostname: API_URL.replace('http://', '').replace('https://', '').split(':')[0],
      port: API_URL.includes(':4000') ? 4000 : 80,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.errors) {
            reject(new Error(response.errors[0].message));
          } else {
            resolve(response.data);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testSyncSingleOrder() {
  console.log('\n🔄 Test 1: Sync Single Order');
  console.log('================================');

  const orderId = process.env.TEST_ORDER_ID || 'ORD-1730726400000-abc123';
  const vendorId = process.env.TEST_VENDOR_ID || '0GI3MojVnLfvzSEqMc25oCzAm Cz2';

  const query = `
    mutation SyncOrder($orderId: ID!, $vendorId: String) {
      syncOrderFromMenuVerse(orderId: $orderId, vendorId: $vendorId) {
        id
        orderId
        orderStatus
        restaurant
        lastSyncedAt
        riderInfo {
          name
          phone
          vehicle
          plateNumber
        }
        statusHistory {
          status
          timestamp
          note
        }
      }
    }
  `;

  try {
    const result = await graphqlRequest(query, { orderId, vendorId });
    console.log('✅ Order synced successfully!');
    console.log('\nOrder Details:');
    console.log('- Order ID:', result.syncOrderFromMenuVerse.orderId);
    console.log('- Status:', result.syncOrderFromMenuVerse.orderStatus);
    console.log('- Restaurant:', result.syncOrderFromMenuVerse.restaurant);
    console.log('- Last Synced:', result.syncOrderFromMenuVerse.lastSyncedAt);
    
    if (result.syncOrderFromMenuVerse.riderInfo) {
      console.log('\nRider Info:');
      console.log('- Name:', result.syncOrderFromMenuVerse.riderInfo.name);
      console.log('- Phone:', result.syncOrderFromMenuVerse.riderInfo.phone);
      console.log('- Vehicle:', result.syncOrderFromMenuVerse.riderInfo.vehicle);
    }

    console.log('\nStatus History:');
    result.syncOrderFromMenuVerse.statusHistory.forEach((update, i) => {
      console.log(`  ${i + 1}. ${update.status} - ${update.note} (${new Date(update.timestamp).toLocaleString()})`);
    });

    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return false;
  }
}

async function testSyncAllOrders() {
  console.log('\n🔄 Test 2: Sync All Orders');
  console.log('================================');

  const query = `
    mutation SyncAllOrders($limit: Int) {
      syncAllOrdersFromMenuVerse(limit: $limit) {
        id
        orderId
        orderStatus
        restaurant
        lastSyncedAt
        menuVerseVendorId
      }
    }
  `;

  try {
    const result = await graphqlRequest(query, { limit: 10 });
    const orders = result.syncAllOrdersFromMenuVerse;
    
    console.log(`✅ Synced ${orders.length} orders successfully!`);
    
    if (orders.length > 0) {
      console.log('\nOrders:');
      orders.forEach((order, i) => {
        console.log(`\n  ${i + 1}. ${order.orderId}`);
        console.log(`     Status: ${order.orderStatus}`);
        console.log(`     Restaurant: ${order.restaurant}`);
        console.log(`     Vendor ID: ${order.menuVerseVendorId || 'N/A'}`);
        console.log(`     Last Synced: ${order.lastSyncedAt || 'Never'}`);
      });
    } else {
      console.log('\nℹ️  No orders found with MenuVerse vendor IDs');
    }

    return true;
  } catch (error) {
    console.error('❌ Bulk sync failed:', error.message);
    return false;
  }
}

async function testWebhook() {
  console.log('\n🪝 Test 3: Webhook Update');
  console.log('================================');

  const orderId = process.env.TEST_ORDER_ID || 'ORD-1730726400000-abc123';

  const query = `
    mutation WebhookUpdate(
      $orderId: ID!
      $status: String!
      $restaurantId: String
      $restaurantName: String
      $riderInfo: RiderInfoInput
    ) {
      webhookMenuVerseOrderUpdate(
        orderId: $orderId
        status: $status
        restaurantId: $restaurantId
        restaurantName: $restaurantName
        riderInfo: $riderInfo
      ) {
        id
        orderId
        orderStatus
        riderInfo {
          name
          phone
        }
      }
    }
  `;

  try {
    const result = await graphqlRequest(query, {
      orderId,
      status: 'CONFIRMED',
      restaurantId: '0GI3MojVnLfvzSEqMc25oCzAmCz2',
      restaurantName: 'Test Restaurant',
      riderInfo: {
        name: 'John Doe',
        phone: '+234-XXX-XXX-XXXX',
        vehicle: 'Motorcycle',
        plateNumber: 'ABC-123'
      }
    });

    console.log('✅ Webhook processed successfully!');
    console.log('\nUpdated Order:');
    console.log('- Order ID:', result.webhookMenuVerseOrderUpdate.orderId);
    console.log('- Status:', result.webhookMenuVerseOrderUpdate.orderStatus);
    
    if (result.webhookMenuVerseOrderUpdate.riderInfo) {
      console.log('- Rider:', result.webhookMenuVerseOrderUpdate.riderInfo.name);
      console.log('- Phone:', result.webhookMenuVerseOrderUpdate.riderInfo.phone);
    }

    return true;
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 MenuVerse Order Sync Test Suite');
  console.log('=====================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '***' + AUTH_TOKEN.slice(-4) : 'Not set'}`);
  
  if (!AUTH_TOKEN) {
    console.log('\n⚠️  Warning: No AUTH_TOKEN set. Set it with:');
    console.log('   export AUTH_TOKEN="your-firebase-token"');
    console.log('\n   You can get a token by signing in through the GraphQL API');
  }

  console.log('\n💡 Tips:');
  console.log('   - Set TEST_ORDER_ID to test with a specific order');
  console.log('   - Set TEST_VENDOR_ID to sync from a specific MenuVerse vendor');
  console.log('   - Ensure SECONDARY_FIREBASE_* env vars are configured\n');

  const results = [];

  // Test 1: Single order sync
  results.push(await testSyncSingleOrder());
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Bulk sync
  results.push(await testSyncAllOrders());
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Webhook
  results.push(await testWebhook());

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { graphqlRequest, testSyncSingleOrder, testSyncAllOrders, testWebhook };
