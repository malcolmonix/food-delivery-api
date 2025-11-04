// Test GraphQL order query
// For now, let's just check the database directly
require('dotenv').config();
const { db } = require('./firebase');

async function testOrderQuery() {
  const orderId = 'NY3Klx8KZ7EW0VFgZnOE';
  const token = 'YOUR_FIREBASE_TOKEN'; // You'll need a real token
  
  const query = `
    query GetOrder($id: ID!) {
      order(id: $id) {
        id
        orderId
        orderStatus
        restaurant
        orderAmount
        statusHistory {
          status
          timestamp
          note
        }
      }
    }
  `;
  
  try {
    const response = await axios.post('http://localhost:4000/graphql', {
      query,
      variables: { id: orderId }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ GraphQL Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// For now, let's just check the database directly
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
