// Check database for order status
require('dotenv').config();
const { db } = require('./firebase');

async function checkDatabase() {
  const orderId = 'NY3Klx8KZ7EW0VFgZnOE';
  
  console.log('🔍 Checking database for order:', orderId);
  console.log('');
  
  // Check customer-orders collection
  const customerOrderDoc = await db.collection('customer-orders').doc(orderId).get();
  
  if (customerOrderDoc.exists) {
    const data = customerOrderDoc.data();
    console.log('📦 Found in customer-orders:');
    console.log('  - orderStatus:', data.orderStatus);
    console.log('  - status:', data.status);
    console.log('  - statusHistory:', data.statusHistory?.length, 'entries');
    if (data.statusHistory) {
      data.statusHistory.forEach((h, i) => {
        console.log(`    ${i + 1}. ${h.status} - ${h.timestamp?.toDate?.()}`);
      });
    }
  } else {
    console.log('❌ Not found in customer-orders');
  }
  
  // Check orders collection
  const orderDoc = await db.collection('orders').doc(orderId).get();
  if (orderDoc.exists) {
    const data = orderDoc.data();
    console.log('\n📦 Found in orders:');
    console.log('  - orderStatus:', data.orderStatus);
    console.log('  - status:', data.status);
  } else {
    console.log('\n❌ Not found in orders collection');
  }
  
  process.exit(0);
}

checkDatabase();
