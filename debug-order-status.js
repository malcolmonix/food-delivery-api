// Debug script to check if status sync is actually working
require('dotenv').config();
const { db } = require('./firebase');

async function debugOrderStatus() {
  try {
    const orderId = 'NY3Klx8KZ7EW0VFgZnOE'; // One of your migrated orders
    const customerId = '0GI3MojVnLfvzSEqMc25oCzAmCz2';
    
    console.log('🔍 Checking order status in both collections...\n');
    
    // Check vendor order
    console.log('📦 VENDOR ORDER (eateries collection):');
    const vendorOrderSnap = await db.collection('eateries')
      .doc(customerId)
      .collection('orders')
      .doc(orderId)
      .get();
    
    if (vendorOrderSnap.exists) {
      const vendorOrder = vendorOrderSnap.data();
      console.log('  Status:', vendorOrder.status);
      console.log('  Has statusHistory:', !!vendorOrder.statusHistory);
      if (vendorOrder.statusHistory) {
        console.log('  Status history entries:', vendorOrder.statusHistory.length);
        vendorOrder.statusHistory.forEach((entry, i) => {
          console.log(`    ${i + 1}. ${entry.status} - ${entry.timestamp?.toDate?.() || 'no timestamp'}`);
        });
      }
    } else {
      console.log('  ❌ Vendor order not found!');
    }
    
    // Check customer order
    console.log('\n👤 CUSTOMER ORDER (customer-orders collection):');
    const customerOrderSnap = await db.collection('customer-orders')
      .doc(orderId)
      .get();
    
    if (customerOrderSnap.exists) {
      const customerOrder = customerOrderSnap.data();
      console.log('  Status (orderStatus):', customerOrder.orderStatus);
      console.log('  Has statusHistory:', !!customerOrder.statusHistory);
      if (customerOrder.statusHistory) {
        console.log('  Status history entries:', customerOrder.statusHistory.length);
        customerOrder.statusHistory.forEach((entry, i) => {
          console.log(`    ${i + 1}. ${entry.status} - ${entry.timestamp?.toDate?.() || 'no timestamp'}`);
        });
      }
    } else {
      console.log('  ❌ Customer order not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

debugOrderStatus();
