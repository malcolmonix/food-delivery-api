// Manually trigger status update like MenuVerse would do
require('dotenv').config();
const { admin, db } = require('./firebase');

async function updateOrderStatus() {
  try {
    const orderId = 'NY3Klx8KZ7EW0VFgZnOE';
    const vendorId = '0GI3MojVnLfvzSEqMc25oCzAmCz2';
    const newStatus = 'Confirmed';
    
    console.log('🔄 Updating order status...\n');
    
    // Step 1: Update vendor order
    console.log('1️⃣ Updating vendor order...');
    const vendorOrderRef = db.collection('eateries').doc(vendorId).collection('orders').doc(orderId);
    await vendorOrderRef.update({
      status: newStatus,
      updatedAt: admin.firestore.Timestamp.now()
    });
    console.log('   ✅ Vendor order updated to:', newStatus);
    
    // Step 2: Get vendor order to find customerId
    console.log('\n2️⃣ Finding customer order...');
    const vendorOrderSnap = await vendorOrderRef.get();
    const vendorOrder = vendorOrderSnap.data();
    const customerId = vendorOrder.customerId || vendorOrder.customer?.uid;
    
    if (!customerId) {
      console.log('   ❌ No customerId found!');
      return;
    }
    
    console.log('   Found customerId:', customerId);
    
    // Step 3: Find and update customer order
    console.log('\n3️⃣ Updating customer order...');
    
    // Query customer-orders
    const customerOrdersSnapshot = await db.collection('customer-orders')
      .where('customerId', '==', customerId)
      .where('orderId', '==', orderId)
      .get();
    
    if (customerOrdersSnapshot.empty) {
      console.log('   ❌ No customer order found!');
      return;
    }
    
    console.log('   Found customer order(s):', customerOrdersSnapshot.size);
    
    // Update customer order
    const batch = db.batch();
    const timestamp = admin.firestore.Timestamp.now();
    
    customerOrdersSnapshot.forEach((doc) => {
      const docData = doc.data();
      const existingHistory = docData.statusHistory || [];
      
      console.log('   Current status:', docData.orderStatus);
      console.log('   Current history entries:', existingHistory.length);
      
      batch.update(doc.ref, {
        orderStatus: newStatus,
        updatedAt: timestamp,
        statusHistory: [
          ...existingHistory,
          {
            status: newStatus,
            timestamp: timestamp,
            note: 'Updated by vendor'
          }
        ]
      });
    });
    
    await batch.commit();
    console.log('   ✅ Customer order synced!\n');
    
    // Verify the update
    console.log('4️⃣ Verifying update...');
    const verifySnap = await db.collection('customer-orders').doc(orderId).get();
    const verifyData = verifySnap.data();
    console.log('   New status:', verifyData.orderStatus);
    console.log('   History entries:', verifyData.statusHistory?.length);
    
    console.log('\n✅ Status update complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

updateOrderStatus();
