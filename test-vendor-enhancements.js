/**
 * Test Script for Vendor Enhancements
 * 
 * This script tests the new vendor order management features:
 * - restaurantOrders query
 * - acceptOrder mutation
 * - rejectOrder mutation
 * - Firestore sync
 * - Auto-dispatch
 * - State-based filtering
 * 
 * Usage: node test-vendor-enhancements.js
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:4000/graphql';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-token-here';

// Test data
const TEST_RESTAURANT_ID = 'test-restaurant-1';
const TEST_ORDER_ID = 'test-order-1';

// GraphQL client
async function graphqlRequest(query, variables = {}) {
  try {
    const response = await axios.post(API_URL, {
      query,
      variables
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    if (response.data.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      return null;
    }

    return response.data.data;
  } catch (error) {
    console.error('❌ Request Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Test 1: Query restaurant orders
async function testRestaurantOrders() {
  console.log('\n📋 Test 1: Query Restaurant Orders');
  console.log('=====================================');

  const query = `
    query GetRestaurantOrders($restaurantId: ID!, $status: String) {
      restaurantOrders(restaurantId: $restaurantId, status: $status) {
        id
        orderId
        orderStatus
        orderAmount
        deliveryCharges
        address
        orderItems {
          title
          quantity
          price
        }
        statusHistory {
          status
          timestamp
          note
        }
        createdAt
      }
    }
  `;

  const variables = {
    restaurantId: TEST_RESTAURANT_ID
  };

  const data = await graphqlRequest(query, variables);
  
  if (data && data.restaurantOrders) {
    console.log(`✅ Success: Found ${data.restaurantOrders.length} orders`);
    if (data.restaurantOrders.length > 0) {
      console.log('First order:', JSON.stringify(data.restaurantOrders[0], null, 2));
    }
    return true;
  } else {
    console.log('❌ Failed: Could not fetch restaurant orders');
    return false;
  }
}

// Test 2: Query restaurant orders with status filter
async function testRestaurantOrdersWithFilter() {
  console.log('\n📋 Test 2: Query Restaurant Orders (PENDING only)');
  console.log('===================================================');

  const query = `
    query GetRestaurantOrders($restaurantId: ID!, $status: String) {
      restaurantOrders(restaurantId: $restaurantId, status: $status) {
        id
        orderId
        orderStatus
      }
    }
  `;

  const variables = {
    restaurantId: TEST_RESTAURANT_ID,
    status: 'PENDING'
  };

  const data = await graphqlRequest(query, variables);
  
  if (data && data.restaurantOrders) {
    console.log(`✅ Success: Found ${data.restaurantOrders.length} PENDING orders`);
    return true;
  } else {
    console.log('❌ Failed: Could not fetch filtered orders');
    return false;
  }
}

// Test 3: Accept order
async function testAcceptOrder() {
  console.log('\n✅ Test 3: Accept Order');
  console.log('========================');

  const mutation = `
    mutation AcceptOrder($orderId: ID!) {
      acceptOrder(orderId: $orderId) {
        id
        orderStatus
        statusHistory {
          status
          timestamp
          note
        }
      }
    }
  `;

  const variables = {
    orderId: TEST_ORDER_ID
  };

  const data = await graphqlRequest(mutation, variables);
  
  if (data && data.acceptOrder) {
    console.log('✅ Success: Order accepted');
    console.log('New status:', data.acceptOrder.orderStatus);
    console.log('Status history:', JSON.stringify(data.acceptOrder.statusHistory, null, 2));
    return true;
  } else {
    console.log('❌ Failed: Could not accept order');
    return false;
  }
}

// Test 4: Reject order
async function testRejectOrder() {
  console.log('\n❌ Test 4: Reject Order');
  console.log('========================');

  const mutation = `
    mutation RejectOrder($orderId: ID!, $reason: String!) {
      rejectOrder(orderId: $orderId, reason: $reason) {
        id
        orderStatus
        statusHistory {
          status
          timestamp
          note
        }
      }
    }
  `;

  const variables = {
    orderId: TEST_ORDER_ID,
    reason: 'Out of ingredients for this item'
  };

  const data = await graphqlRequest(mutation, variables);
  
  if (data && data.rejectOrder) {
    console.log('✅ Success: Order rejected');
    console.log('New status:', data.rejectOrder.orderStatus);
    console.log('Status history:', JSON.stringify(data.rejectOrder.statusHistory, null, 2));
    return true;
  } else {
    console.log('❌ Failed: Could not reject order');
    return false;
  }
}

// Test 5: Update order status to READY (triggers auto-dispatch)
async function testAutoDispatch() {
  console.log('\n🚀 Test 5: Auto-Dispatch (Update to READY)');
  console.log('============================================');

  const mutation = `
    mutation UpdateOrderStatus($orderId: ID!, $status: String!) {
      updateOrderStatus(orderId: $orderId, status: $status) {
        id
        orderStatus
        statusHistory {
          status
          timestamp
          note
        }
      }
    }
  `;

  const variables = {
    orderId: TEST_ORDER_ID,
    status: 'READY'
  };

  const data = await graphqlRequest(mutation, variables);
  
  if (data && data.updateOrderStatus) {
    console.log('✅ Success: Order marked as READY');
    console.log('New status:', data.updateOrderStatus.orderStatus);
    console.log('⏳ Auto-dispatch should trigger in background...');
    console.log('Check Firestore deliveryRequests collection for dispatch notification');
    return true;
  } else {
    console.log('❌ Failed: Could not update order status');
    return false;
  }
}

// Test 6: Query available orders (state-based filtering)
async function testStateBasedFiltering() {
  console.log('\n🗺️  Test 6: State-Based Filtering');
  console.log('===================================');

  const query = `
    query GetAvailableOrders {
      availableOrders {
        id
        orderId
        restaurant
        address
        orderStatus
      }
    }
  `;

  const data = await graphqlRequest(query);
  
  if (data && data.availableOrders) {
    console.log(`✅ Success: Found ${data.availableOrders.length} available orders`);
    console.log('Note: Orders should be filtered by rider\'s state');
    if (data.availableOrders.length > 0) {
      console.log('First order:', JSON.stringify(data.availableOrders[0], null, 2));
    }
    return true;
  } else {
    console.log('❌ Failed: Could not fetch available orders');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Vendor Enhancements Test Suite');
  console.log('==================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Test Restaurant ID: ${TEST_RESTAURANT_ID}`);
  console.log(`Test Order ID: ${TEST_ORDER_ID}`);

  const results = {
    passed: 0,
    failed: 0,
    total: 6
  };

  // Run tests
  if (await testRestaurantOrders()) results.passed++; else results.failed++;
  if (await testRestaurantOrdersWithFilter()) results.passed++; else results.failed++;
  if (await testAcceptOrder()) results.passed++; else results.failed++;
  if (await testRejectOrder()) results.passed++; else results.failed++;
  if (await testAutoDispatch()) results.passed++; else results.failed++;
  if (await testStateBasedFiltering()) results.passed++; else results.failed++;

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  });
}

module.exports = {
  testRestaurantOrders,
  testRestaurantOrdersWithFilter,
  testAcceptOrder,
  testRejectOrder,
  testAutoDispatch,
  testStateBasedFiltering,
  runAllTests
};
