/**
 * Direct test of getOrdersByUser function
 * This bypasses GraphQL and tests the database function directly
 */

const { dbHelpers } = require('./database.supabase');

async function testGetOrders() {
  console.log('🧪 Testing getOrdersByUser function directly...\n');

  const testUserId = '0GI3MojVnLfvzSEqMc25oCzAmCz2'; // Your user ID from logs

  try {
    console.log(`📦 Calling dbHelpers.getOrdersByUser('${testUserId}')...`);
    const orders = await dbHelpers.getOrdersByUser(testUserId);
    
    console.log('\n📊 Result:');
    console.log('  Type:', typeof orders);
    console.log('  Is Array:', Array.isArray(orders));
    console.log('  Is Null:', orders === null);
    console.log('  Is Undefined:', orders === undefined);
    console.log('  Length:', orders?.length || 'N/A');

    if (orders && Array.isArray(orders)) {
      console.log(`\n✅ SUCCESS: Got ${orders.length} orders`);
      
      if (orders.length > 0) {
        console.log('\n📋 First order:');
        console.log(JSON.stringify(orders[0], null, 2));
        
        console.log('\n🔍 Order fields:');
        console.log('  - orderId:', orders[0].orderId);
        console.log('  - orderStatus:', orders[0].orderStatus);
        console.log('  - orderItems type:', typeof orders[0].orderItems);
        console.log('  - orderItems value:', orders[0].orderItems);
        console.log('  - restaurant:', orders[0].restaurant);
      } else {
        console.log('\n⚠️  No orders found for this user');
      }
    } else {
      console.log('\n❌ ERROR: Result is not an array!');
      console.log('   Actual value:', orders);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  }

  process.exit(0);
}

testGetOrders();
