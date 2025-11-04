// Test script to update order status and verify sync to customer-orders
require('dotenv').config();
const { admin, db } = require('./firebase');

async function testStatusSync() {
  try {
    // Use one of the migrated orders
    const orderId = 'ZvFcYl5gJ30oPB1HRlOI';
    const vendorId = '0GI3MojVnLfvzSEqMc25oCzAmCz2';
    const customerId = '0GI3MojVnLfvzSEqMc25oCzAmCz2';
    
    console.log('🧪 Testing Order Status Sync\n');
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`👨‍💼 Vendor ID: ${vendorId}`);
    console.log(`👤 Customer ID: ${customerId}\n`);
    
    // Step 1: Check current status
    console.log('1️⃣ Checking current status...');
    const customerOrderRef = db.collection('customer-orders').doc(orderId);
    const beforeSnap = await customerOrderRef.get();
    
    if (!beforeSnap.exists) {
      console.log('❌ Customer order not found!');
      process.exit(1);
    }
    
    const beforeData = beforeSnap.data();
    console.log(`   Current status: ${beforeData.orderStatus}`);
    console.log(`   Status history entries: ${beforeData.statusHistory?.length || 0}\n`);
    
    // Step 2: Update vendor order status (simulating MenuVerse action)
    console.log('2️⃣ Updating vendor order status to "Confirmed"...');
    const vendorOrderRef = db.collection('eateries').doc(vendorId).collection('orders').doc(orderId);
    
    await vendorOrderRef.update({
      status: 'Confirmed',
      updatedAt: admin.firestore.Timestamp.now()
    });
    console.log('   ✅ Vendor order updated\n');
    
    // Step 3: Simulate the MenuVerse sync function
    console.log('3️⃣ Running sync to customer-orders...');
    
    // Get vendor order to extract customerId
    const vendorOrderSnap = await vendorOrderRef.get();
    const vendorOrder = vendorOrderSnap.data();
    
    if (!vendorOrder) {
      console.log('❌ Vendor order not found!');
      process.exit(1);
    }
    
    // Query customer-orders by customerId and orderId
    const customerOrdersQuery = db.collection('customer-orders')
      .where('customerId', '==', customerId)
      .where('orderId', '==', orderId);
    
    const customerOrdersSnap = await customerOrdersQuery.get();
    
    if (customerOrdersSnap.empty) {
      console.log('❌ No matching customer order found!');
      process.exit(1);
    }
    
    // Update all matching customer orders using batch
    const batch = db.batch();
    
    customerOrdersSnap.forEach(doc => {
      const customerOrderRef = doc.ref;
      const currentData = doc.data();
      const currentHistory = currentData.statusHistory || [];
      
      batch.update(customerOrderRef, {
        orderStatus: 'Confirmed',
        updatedAt: admin.firestore.Timestamp.now(),
        statusHistory: [
          ...currentHistory,
          {
            status: 'Confirmed',
            timestamp: admin.firestore.Timestamp.now(),
            note: 'Status updated by vendor (test script)'
          }
        ]
      });
      
      console.log(`   📝 Updating customer order: ${doc.id}`);
    });
    
    await batch.commit();
    console.log('   ✅ Customer orders synced\n');
    
    // Step 4: Verify the sync worked
    console.log('4️⃣ Verifying sync results...');
    const afterSnap = await customerOrderRef.get();
    const afterData = afterSnap.data();
    
    console.log(`   New status: ${afterData.orderStatus}`);
    console.log(`   Status history entries: ${afterData.statusHistory?.length || 0}`);
    
    if (afterData.statusHistory && afterData.statusHistory.length > 0) {
      const latestHistory = afterData.statusHistory[afterData.statusHistory.length - 1];
      console.log(`   Latest history entry:`);
      console.log(`     - Status: ${latestHistory.status}`);
      console.log(`     - Time: ${latestHistory.timestamp?.toDate?.() || 'N/A'}`);
      console.log(`     - Note: ${latestHistory.note || 'N/A'}`);
    }
    
    console.log('\n✅ Status sync test completed successfully!');
    console.log('\n📱 Next steps:');
    console.log('   1. Refresh ChopChop orders page at http://localhost:3001/orders');
    console.log('   2. Click on this order to see the updated status');
    console.log('   3. Verify the timeline shows "Confirmed" as current step');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testStatusSync();
