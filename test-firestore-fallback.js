// Test Firestore fallback for order tracking
require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:4000/graphql';

// Use one of the order IDs we found in Firestore
const TEST_ORDER_ID = 'ORD-1770745023531-tj4scwwubm';
const TEST_USER_ID = '0GI3MojVnLfvzSEqMc25oCzAmCz2';

async function testFirestoreFallback() {
    console.log('🧪 Testing Firestore Fallback for Order Tracking\n');
    console.log('='.repeat(80));
    
    try {
        // First, get a Firebase token for the test user
        // Note: In production, this would come from the frontend auth
        console.log('\n📝 Test Configuration:');
        console.log(`   Order ID: ${TEST_ORDER_ID}`);
        console.log(`   User ID: ${TEST_USER_ID}`);
        console.log(`   API URL: ${API_URL}`);
        
        // For testing, we'll use a mock token
        // In real scenario, you'd need to authenticate with Firebase first
        const mockToken = 'test-token'; // This will fail auth, but we can test without auth for now
        
        const query = `
            query GetOrderTracking($orderId: String!) {
                orderTracking(orderId: $orderId) {
                    id
                    orderId
                    restaurantName
                    orderStatus
                    deliveryStatus
                    orderAmount
                    deliveryCharges
                    tipping
                    taxationAmount
                    paidAmount
                    paymentMethod
                    deliveryAddress
                    instructions
                    orderDate
                    estimatedDeliveryTime
                    customer {
                        name
                        email
                        phone
                        address
                    }
                    items {
                        id
                        name
                        quantity
                        price
                        variation
                        addons
                    }
                    rider {
                        displayName
                        phoneNumber
                        vehicleType
                        licensePlate
                        latitude
                        longitude
                    }
                    statusHistory {
                        status
                        timestamp
                        message
                    }
                }
            }
        `;
        
        console.log('\n🚀 Sending GraphQL query...');
        
        const response = await axios.post(API_URL, {
            query,
            variables: { orderId: TEST_ORDER_ID }
        }, {
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${mockToken}` // Uncomment when you have a real token
            }
        });
        
        console.log('\n📊 Response Status:', response.status);
        
        if (response.data.errors) {
            console.log('\n❌ GraphQL Errors:');
            response.data.errors.forEach((error, index) => {
                console.log(`\n  Error ${index + 1}:`);
                console.log(`    Message: ${error.message}`);
                console.log(`    Code: ${error.extensions?.code || 'N/A'}`);
                if (error.extensions?.orderId) {
                    console.log(`    Order ID: ${error.extensions.orderId}`);
                }
            });
        }
        
        if (response.data.data?.orderTracking) {
            console.log('\n✅ Order Tracking Data Retrieved:');
            const order = response.data.data.orderTracking;
            console.log(`\n  Order ID: ${order.orderId}`);
            console.log(`  Restaurant: ${order.restaurantName}`);
            console.log(`  Status: ${order.orderStatus}`);
            console.log(`  Amount: $${order.orderAmount}`);
            console.log(`  Items: ${order.items.length} items`);
            console.log(`  Customer: ${order.customer.name}`);
            
            if (order.rider) {
                console.log(`  Rider: ${order.rider.displayName}`);
            } else {
                console.log(`  Rider: Not assigned yet`);
            }
        }
        
        console.log('\n' + '='.repeat(80));
        
    } catch (error) {
        console.error('\n❌ Test Failed:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Error:', error.message);
        }
    }
}

testFirestoreFallback().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
}).catch(err => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
});
