// Search for an order by orderId field
require('dotenv').config();
const { db } = require('./firebase');

async function searchByOrderId() {
  const searchId = 'LQdffTTr'; // or CC- prefix
  
  console.log('🔍 Searching for order with orderId containing:', searchId);
  
  // Search customer-orders
  const customerOrders = await db.collection('customer-orders').get();
  
  console.log(`\nSearching ${customerOrders.size} customer orders...`);
  
  customerOrders.forEach(doc => {
    const data = doc.data();
    const orderId = data.orderId || doc.id;
    if (orderId.includes(searchId) || doc.id.includes(searchId)) {
      console.log('\n✅ FOUND:');
      console.log('  Document ID:', doc.id);
      console.log('  orderId field:', data.orderId);
      console.log('  status:', data.orderStatus);
      console.log('  customerId:', data.customerId);
      console.log('  Has statusHistory:', !!data.statusHistory);
    }
  });
  
  process.exit(0);
}

searchByOrderId();
