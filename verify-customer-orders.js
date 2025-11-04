// Verify customer-orders exist for the user
require('dotenv').config();
const { db } = require('./firebase');

async function verifyOrders() {
  const customerId = '0GI3MojVnLfvzSEqMc25oCzAmCz2'; // Malcolm's UID
  
  console.log('🔍 Checking customer-orders for user:', customerId);
  console.log('');
  
  const snapshot = await db.collection('customer-orders')
    .where('customerId', '==', customerId)
    .get();
  
  console.log(`📦 Found ${snapshot.size} orders\n`);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Order: ${doc.id}`);
    console.log(`  orderId: ${data.orderId}`);
    console.log(`  status: ${data.orderStatus || data.status}`);
    console.log(`  customerId: ${data.customerId}`);
    console.log(`  restaurant: ${data.restaurantName}`);
    console.log(`  amount: ₦${data.orderAmount || data.paidAmount}`);
    console.log('');
  });
  
  process.exit(0);
}

verifyOrders();
