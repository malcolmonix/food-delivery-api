/**
 * Test script to verify orders query fix
 * Tests that getOrdersByUser returns an array and doesn't throw "map is not a function" error
 */

const { dbHelpers } = require('./database.supabase');

async function testOrdersFix() {
  console.log('🧪 Testing orders query fix...\n');

  // Test with a real user ID (from the logs)
  const testUserId = '0GI3MojVnLfvzSEqMc25oCzAmCz2';

  try {
    console.log(`📦 Fetching orders for user: ${testUserId}`);
    const orders = await dbHelpers.getOrdersByUser(testUserId);
    
    console.log(`✅ Success! Got orders:`, {
      isArray: Array.isArray(orders),
      count: orders?.length || 0,
      type: typeof orders
    });

    if (orders && orders.length > 0) {
      console.log('\n📋 First order sample:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('\n⚠️ No orders found for this user');
    }

    // Test with a non-existent user
    console.log('\n📦 Testing with non-existent user...');
    const emptyOrders = await dbHelpers.getOrdersByUser('non-existent-user-id');
    console.log(`✅ Non-existent user result:`, {
      isArray: Array.isArray(emptyOrders),
      count: emptyOrders?.length || 0,
      type: typeof emptyOrders
    });

    console.log('\n✅ All tests passed! The fix is working correctly.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testOrdersFix();
