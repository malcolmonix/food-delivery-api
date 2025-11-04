// Check the structure of an existing order to understand what data we have
require('dotenv').config();
const { db } = require('./firebase');

async function checkOrder() {
  try {
    // Check one of the orders from the migration output
    const orderRef = db.collection('eateries')
      .doc('0GI3MojVnLfvzSEqMc25oCzAmCz2')
      .collection('orders')
      .doc('8jiVky7IZN1LUIBLK0nt');
    
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) {
      console.log('❌ Order not found');
      return;
    }
    
    const orderData = orderSnap.data();
    console.log('\n📦 Order Data Structure:');
    console.log(JSON.stringify(orderData, null, 2));
    
    console.log('\n🔍 Key Fields:');
    console.log('- Has customerId:', !!orderData.customerId);
    console.log('- Has customer object:', !!orderData.customer);
    console.log('- Has customer.uid:', !!orderData.customer?.uid);
    console.log('- Has customer.email:', !!orderData.customer?.email);
    console.log('- Has userId:', !!orderData.userId);
    console.log('- Has uid:', !!orderData.uid);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkOrder();
