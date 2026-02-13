/**
 * Sync Existing Orders to Firestore Subcollections
 * This script syncs all existing Supabase orders to Firestore subcollections
 */

require('dotenv').config();

const { supabase } = require('./supabase');
const { admin } = require('./firebase');

async function syncExistingOrders() {
  console.log('🔄 Starting sync of existing orders to Firestore subcollections\n');
  console.log('='.repeat(60));

  try {
    // Get all orders from Supabase
    console.log('\n📦 Fetching orders from Supabase...');
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    console.log(`✅ Found ${orders.length} orders to sync\n`);

    if (!admin || !admin.firestore) {
      throw new Error('Firebase Admin not initialized');
    }

    const firestore = admin.firestore();
    let successCount = 0;
    let errorCount = 0;

    // Sync each order
    for (const order of orders) {
      try {
        console.log(`\n🔄 Syncing order ${order.order_id}...`);
        console.log(`   User: ${order.user_id}`);
        console.log(`   Restaurant: ${order.restaurant}`);
        console.log(`   Status: ${order.order_status}`);

        // Prepare order data for Firestore
        const firestoreData = {
          orderId: order.order_id,
          userId: order.user_id,
          restaurant: order.restaurant,
          riderId: order.rider_id || null,
          orderStatus: order.order_status,
          orderAmount: order.order_amount,
          deliveryCharges: order.delivery_charges,
          address: order.address,
          orderItems: order.order_items,
          statusHistory: order.status_history || [],
          customer: order.customer_info || {
            id: order.user_id,
            name: 'Customer',
            email: '',
            phone: ''
          },
          paymentMethod: order.payment_method,
          orderDate: order.order_date,
          createdAt: order.created_at,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Use the order ID as the document ID
        const orderIdStr = order.id.toString();

        // 1. Sync to main orders collection
        await firestore.collection('orders').doc(orderIdStr).set(firestoreData, { merge: true });
        console.log(`   ✅ Synced to orders/${orderIdStr}`);

        // 2. Sync to vendor-orders subcollection
        if (order.restaurant) {
          await firestore
            .collection('vendor-orders')
            .doc(order.restaurant)
            .collection('orders')
            .doc(orderIdStr)
            .set(firestoreData, { merge: true });
          console.log(`   ✅ Synced to vendor-orders/${order.restaurant}/orders/${orderIdStr}`);
        } else {
          console.log(`   ⚠️  No restaurant ID, skipping vendor-orders sync`);
        }

        // 3. Sync to customer-orders subcollection
        if (order.user_id) {
          await firestore
            .collection('customer-orders')
            .doc(order.user_id)
            .collection('orders')
            .doc(orderIdStr)
            .set(firestoreData, { merge: true });
          console.log(`   ✅ Synced to customer-orders/${order.user_id}/orders/${orderIdStr}`);
        } else {
          console.log(`   ⚠️  No user ID, skipping customer-orders sync`);
        }

        // 4. Sync to rider-orders subcollection (if rider assigned)
        if (order.rider_id) {
          await firestore
            .collection('rider-orders')
            .doc(order.rider_id)
            .collection('orders')
            .doc(orderIdStr)
            .set(firestoreData, { merge: true });
          console.log(`   ✅ Synced to rider-orders/${order.rider_id}/orders/${orderIdStr}`);
        }

        successCount++;
        console.log(`   ✅ Order ${order.order_id} synced successfully`);

      } catch (orderError) {
        errorCount++;
        console.error(`   ❌ Failed to sync order ${order.order_id}:`, orderError.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Sync complete!`);
    console.log(`   Success: ${successCount} orders`);
    console.log(`   Errors: ${errorCount} orders`);

    // Verify sync
    console.log('\n🔍 Verifying sync...');
    if (orders.length > 0) {
      const sampleOrder = orders[0];
      const sampleRestaurant = sampleOrder.restaurant;
      const sampleUserId = sampleOrder.user_id;

      const vendorOrdersSnapshot = await firestore
        .collection('vendor-orders')
        .doc(sampleRestaurant)
        .collection('orders')
        .limit(5)
        .get();
      console.log(`✅ vendor-orders/${sampleRestaurant}/orders: ${vendorOrdersSnapshot.size} documents`);

      const customerOrdersSnapshot = await firestore
        .collection('customer-orders')
        .doc(sampleUserId)
        .collection('orders')
        .limit(5)
        .get();
      console.log(`✅ customer-orders/${sampleUserId}/orders: ${customerOrdersSnapshot.size} documents`);
    }

    console.log('\n✅ All done!\n');

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run sync
if (require.main === module) {
  syncExistingOrders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncExistingOrders };
