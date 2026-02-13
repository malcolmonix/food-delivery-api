/**
 * Test ChopChop Orders Query
 * Tests the GraphQL orders query that ChopChop uses
 */

require('dotenv').config();

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:4000/graphql';

// Test user ID (from the orders we synced)
const TEST_USER_ID = '0GI3MojVnLfvzSEqMc25oCzAmCz2';

async function testChopChopOrders() {
  console.log('🧪 Testing ChopChop Orders Query\n');
  console.log('='.repeat(60));

  try {
    // You'll need to get a real Firebase token for this user
    // For now, we'll test without auth to see the error
    console.log('\n📡 Testing orders query (without auth)...');
    
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
      const response = await axios.post(API_URL, {
        query
      });

      if (response.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
      }

      if (response.data.data) {
        console.log('✅ Response data:', JSON.stringify(response.data.data, null, 2));
      }
    } catch (error) {
      console.error('❌ Request failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 To test with authentication:');
    console.log('1. Login to ChopChop in your browser');
    console.log('2. Open browser console');
    console.log('3. Run: firebase.auth().currentUser.getIdToken().then(console.log)');
    console.log('4. Copy the token and add it to this script');
    console.log('\n✅ Test complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run test
if (require.main === module) {
  testChopChopOrders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testChopChopOrders };
