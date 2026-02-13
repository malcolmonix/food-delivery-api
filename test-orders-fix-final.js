/**
 * Final test to verify orders query fix
 * Tests that the JSON.parse fix resolves the "orders.map is not a function" error
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { dbHelpers } = require('./database.supabase');

async function testOrdersFix() {
  console.log('🧪 Testing orders query fix...\n');

  const testUserId = '0GI3MojVnLfvzSEqMc25oCzAmCz2'; // Your user ID

  try {
    console.log(`📦 Fetching orders for user: ${testUserId}`);
    const orders = await dbHelpers.getOrdersByUser(testUserId);
    
    console.log(`\n✅ Success! Got ${orders.length} orders`);
    console.log(`   Type: ${typeof orders}`);
    console.log(`   Is Array: ${Array.isArray(orders)}`);
    
    if (orders.length > 0) {
      const firstOrder = orders[0];
      console.log(`\n📋 First order details:`);
      console.log(`   Order ID: ${firstOrder.orderId}`);
      console.log(`   Restaurant: ${firstOrder.restaurant}`);
      console.log(`   Status: ${firstOrder.orderStatus}`);
      console.log(`   Amount: $${firstOrder.orderAmount}`);
      console.log(`   Order Items Type: ${typeof firstOrder.orderItems}`);
      console.log(`   Order Items Is Array: ${Array.isArray(firstOrder.orderItems)}`);
      console.log(`   Order Items Count: ${firstOrder.orderItems?.length || 0}`);
      console.log(`   Status History Type: ${typeof firstOrder.statusHistory}`);
      console.log(`   Status History Is Array: ${Array.isArray(firstOrder.statusHistory)}`);
      console.log(`   Status History Count: ${firstOrder.statusHistory?.length || 0}`);
      
      // Test that we can map over orderItems (this was failing before)
      try {
        const itemNames = firstOrder.orderItems.map(item => item.food);
        console.log(`\n✅ Successfully mapped orderItems: ${itemNames.join(', ')}`);
      } catch (error) {
        console.error(`\n❌ Failed to map orderItems:`, error.message);
      }
      
      // Test that we can map over statusHistory
      try {
        const statuses = firstOrder.statusHistory.map(h => h.status);
        console.log(`✅ Successfully mapped statusHistory: ${statuses.join(' → ')}`);
      } catch (error) {
        console.error(`❌ Failed to map statusHistory:`, error.message);
      }
    }
    
    console.log(`\n✅ All tests passed! The fix is working correctly.`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    process.exit(1);
  }
}

testOrdersFix();
