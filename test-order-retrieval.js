/**
 * Test Order Retrieval from Supabase
 * Verifies that orders can be read from the database
 */

// Load environment variables
require('dotenv').config();

const { supabase } = require('./supabase');

async function testOrderRetrieval() {
  console.log('🧪 Testing Order Retrieval from Supabase\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Get all orders
    console.log('\n📦 Test 1: Fetching all orders...');
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching all orders:', allError);
    } else {
      console.log(`✅ Found ${allOrders.length} orders in database`);
      if (allOrders.length > 0) {
        console.log('\nSample order:');
        console.log(JSON.stringify(allOrders[0], null, 2));
      }
    }

    // Test 2: Get orders by user
    if (allOrders && allOrders.length > 0) {
      const sampleUserId = allOrders[0].user_id;
      console.log(`\n👤 Test 2: Fetching orders for user ${sampleUserId}...`);
      
      const { data: userOrders, error: userError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', sampleUserId)
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('❌ Error fetching user orders:', userError);
      } else {
        console.log(`✅ Found ${userOrders.length} orders for this user`);
      }
    }

    // Test 3: Get orders by restaurant
    if (allOrders && allOrders.length > 0) {
      const sampleRestaurant = allOrders[0].restaurant;
      console.log(`\n🏪 Test 3: Fetching orders for restaurant ${sampleRestaurant}...`);
      
      const { data: restaurantOrders, error: restError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant', sampleRestaurant)
        .order('created_at', { ascending: false});

      if (restError) {
        console.error('❌ Error fetching restaurant orders:', restError);
      } else {
        console.log(`✅ Found ${restaurantOrders.length} orders for this restaurant`);
        console.log('\nOrder details:');
        restaurantOrders.forEach((order, index) => {
          console.log(`  ${index + 1}. Order ${order.order_id} - Status: ${order.order_status} - Amount: ₦${order.order_amount}`);
        });
      }
    }

    // Test 4: Check Firestore sync
    console.log('\n🔥 Test 4: Checking Firestore collections...');
    const { admin } = require('./firebase');
    
    if (admin && admin.firestore) {
      const firestore = admin.firestore();
      
      // Check main orders collection
      const ordersSnapshot = await firestore.collection('orders').limit(5).get();
      console.log(`✅ Firestore orders collection: ${ordersSnapshot.size} documents`);
      
      // Check vendor-orders collection
      if (allOrders && allOrders.length > 0) {
        const sampleRestaurant = allOrders[0].restaurant;
        const vendorOrdersSnapshot = await firestore
          .collection('vendor-orders')
          .doc(sampleRestaurant)
          .collection('orders')
          .limit(5)
          .get();
        console.log(`✅ Firestore vendor-orders/${sampleRestaurant}/orders: ${vendorOrdersSnapshot.size} documents`);
        
        if (vendorOrdersSnapshot.size > 0) {
          console.log('\nSample Firestore order:');
          const sampleDoc = vendorOrdersSnapshot.docs[0];
          console.log(JSON.stringify(sampleDoc.data(), null, 2));
        }
      }
      
      // Check customer-orders collection
      if (allOrders && allOrders.length > 0) {
        const sampleUserId = allOrders[0].user_id;
        const customerOrdersSnapshot = await firestore
          .collection('customer-orders')
          .doc(sampleUserId)
          .collection('orders')
          .limit(5)
          .get();
        console.log(`✅ Firestore customer-orders/${sampleUserId}/orders: ${customerOrdersSnapshot.size} documents`);
      }
    } else {
      console.log('⚠️  Firestore not available');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Order retrieval tests complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
if (require.main === module) {
  testOrderRetrieval()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testOrderRetrieval };
