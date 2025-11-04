// Quick test to verify customer-orders were created successfully
require('dotenv').config();
const { db } = require('./firebase');

async function verifyMigration() {
  try {
    const customerId = '0GI3MojVnLfvzSEqMc25oCzAmCz2'; // Malcolm's user ID
    
    console.log('🔍 Checking customer-orders collection...\n');
    
    const ordersSnapshot = await db.collection('customer-orders')
      .where('customerId', '==', customerId)
      .get();
    
    console.log(`✅ Found ${ordersSnapshot.size} customer orders\n`);
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      console.log(`📦 Order ${doc.id}:`);
      console.log(`   Status: ${order.orderStatus}`);
      console.log(`   Amount: ₦${order.orderAmount}`);
      console.log(`   Restaurant: ${order.restaurantName}`);
      console.log(`   Date: ${order.orderDate?.toDate?.() || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

verifyMigration();
