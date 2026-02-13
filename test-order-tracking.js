// Test the order tracking functionality
require('dotenv').config();
const { dbHelpers } = require('./database.supabase');

async function testOrderTracking() {
    console.log('🧪 Testing Order Tracking Functionality\n');
    console.log('='.repeat(80));
    
    try {
        // Test 1: Get a sample order from database
        console.log('\n📋 Test 1: Fetching sample orders from database...');
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, order_id, user_id, order_status')
            .limit(5);
        
        if (error) {
            console.error('❌ Error fetching orders:', error);
            return;
        }
        
        if (!orders || orders.length === 0) {
            console.log('⚠️  No orders found in database');
            return;
        }
        
        console.log(`✅ Found ${orders.length} orders:`);
        orders.forEach((order, index) => {
            console.log(`  ${index + 1}. Order ID: ${order.order_id}, Status: ${order.order_status}`);
        });
        
        // Test 2: Test getOrderByOrderId with first order
        const testOrder = orders[0];
        console.log(`\n📋 Test 2: Testing getOrderByOrderId with order_id: ${testOrder.order_id}`);
        const result = await dbHelpers.getOrderByOrderId(testOrder.order_id);
        
        if (result) {
            console.log('✅ Order retrieved successfully!');
            console.log('  - ID:', result.id);
            console.log('  - Order ID:', result.orderId);
            console.log('  - User ID:', result.userId);
            console.log('  - Status:', result.orderStatus);
            console.log('  - Amount:', result.orderAmount);
        } else {
            console.log('❌ Order not found');
        }
        
        // Test 3: Test with UUID (fallback strategy)
        console.log(`\n📋 Test 3: Testing fallback strategy with UUID: ${testOrder.id}`);
        const fallbackResult = await dbHelpers.getOrderByOrderId(testOrder.id);
        
        if (fallbackResult) {
            console.log('✅ Fallback strategy worked!');
            console.log('  - Order ID:', fallbackResult.orderId);
        } else {
            console.log('❌ Fallback strategy failed');
        }
        
        // Test 4: Test with non-existent order
        console.log('\n📋 Test 4: Testing with non-existent order ID');
        const nonExistent = await dbHelpers.getOrderByOrderId('ORD-NONEXISTENT-123');
        
        if (nonExistent === null) {
            console.log('✅ Correctly returned null for non-existent order');
        } else {
            console.log('❌ Should have returned null');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ All tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
        console.error('Error details:', error.message);
    }
}

testOrderTracking().then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
}).catch(err => {
    console.error('\n❌ Test script failed:', err);
    process.exit(1);
});
