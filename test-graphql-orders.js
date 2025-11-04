// Quick test to verify GraphQL orders query returns data
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q",
  authDomain: "chopchop-67750.firebaseapp.com",
  projectId: "chopchop-67750",
  storageBucket: "chopchop-67750.firebasestorage.app",
  messagingSenderId: "835361851966",
  appId: "1:835361851966:web:78810ea4389297a8679f6f",
};

async function testGraphQLQuery() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  console.log('🔑 Signing in...');
  // You'll need to use your actual credentials
  const userCredential = await signInWithEmailAndPassword(auth, 'malcolmonix@gmail.com', 'YOUR_PASSWORD');
  const token = await userCredential.user.getIdToken();
  
  console.log('✅ Signed in, got token');
  console.log('📡 Querying GraphQL API...\n');
  
  const query = `
    query GetUserOrders {
      orders {
        id
        orderId
        status: orderStatus
        total: paidAmount
        restaurant
        createdAt
        items: orderItems {
          id
          name: title
          quantity
          price
        }
      }
    }
  `;
  
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });
  
  const result = await response.json();
  
  if (result.errors) {
    console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
  }
  
  if (result.data?.orders) {
    console.log('✅ Success! Found orders:', result.data.orders.length);
    console.log('\nOrders:');
    result.data.orders.forEach((order, i) => {
      console.log(`${i + 1}. ${order.orderId} - ${order.status} - ₦${order.total}`);
    });
  } else {
    console.log('❌ No orders returned');
    console.log('Response:', JSON.stringify(result, null, 2));
  }
  
  process.exit(0);
}

testGraphQLQuery().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
