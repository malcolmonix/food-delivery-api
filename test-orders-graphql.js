/**
 * Direct test of the orders GraphQL query
 * This will show us exactly what the API returns
 */

const fetch = require('node-fetch');

async function testOrdersQuery() {
  console.log('🧪 Testing orders GraphQL query...\n');

  // You'll need to get a real Firebase token from your browser
  // Open DevTools → Application → Local Storage → find the Firebase token
  const token = 'YOUR_FIREBASE_TOKEN_HERE'; // Replace with actual token

  const query = `
    query GetUserOrders {
      orders {
        id
        orderId
        orderStatus
        paidAmount
        createdAt
        orderItems
        restaurant
      }
    }
  `;

  try {
    const response = await fetch('http://localhost:4000/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(result, null, 2));

    if (result.errors) {
      console.log('\n❌ GraphQL Errors:');
      result.errors.forEach(error => {
        console.log('  -', error.message);
        console.log('   ', error.extensions);
      });
    }

    if (result.data) {
      console.log('\n✅ Orders Data:');
      console.log(`   Found ${result.data.orders?.length || 0} orders`);
      if (result.data.orders && result.data.orders.length > 0) {
        console.log('\n   First order:');
        console.log(JSON.stringify(result.data.orders[0], null, 4));
      }
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

console.log('⚠️  NOTE: You need to replace YOUR_FIREBASE_TOKEN_HERE with a real token');
console.log('   Get it from: Browser DevTools → Application → Local Storage → Firebase token\n');

// Uncomment when you have a token:
// testOrdersQuery();
