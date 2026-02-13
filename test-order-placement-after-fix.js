/**
 * Test Order Placement After Coupon Code Column Fix
 * Verifies that orders can be placed successfully after adding coupon_code column
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderPlacement() {
  console.log('🧪 Testing Order Placement After Coupon Code Fix\n');
  
  try {
    // 1. Verify coupon_code column exists
    console.log('1️⃣ Verifying coupon_code column exists...');
    const { data: columns, error: columnError } = await supabase
      .from('orders')
      .select('*')
      .limit(0);
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError.message);
      return;
    }
    
    console.log('✅ Orders table is accessible\n');
    
    // 2. Test creating an order with coupon_code
    console.log('2️⃣ Testing order creation with coupon_code...');
    
    const testOrder = {
      id: `test-order-${Date.now()}`,
      order_id: `ORD-${Date.now()}`,
      user_id: 'test-user-123',
      restaurant: 'Test Restaurant',
      restaurant_id: 'test-restaurant-123',
      order_items: JSON.stringify([
        {
          id: 'item-1',
          name: 'Test Item',
          price: 10.00,
          quantity: 2
        }
      ]),
      order_amount: 20.00,
      paid_amount: 18.00,
      payment_method: 'CASH',
      order_status: 'PENDING',
      order_date: new Date().toISOString(),
      coupon_code: 'TESTCODE10', // This should work now!
      delivery_charges: 2.00,
      tipping: 0.00,
      taxation_amount: 0.00,
      address: '123 Test Street',
      instructions: 'Test order after coupon_code fix'
    };
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Order creation failed:', orderError.message);
      console.error('   Code:', orderError.code);
      console.error('   Details:', orderError.details);
      
      if (orderError.code === 'PGRST204') {
        console.error('\n⚠️  Column still not found! Try:');
        console.error('   1. Wait a few minutes for Supabase cache to refresh');
        console.error('   2. Restart your Supabase project (if self-hosted)');
        console.error('   3. Verify column exists in Supabase dashboard SQL editor:');
        console.error('      SELECT column_name FROM information_schema.columns');
        console.error('      WHERE table_name = \'orders\' AND column_name = \'coupon_code\';');
      }
      return;
    }
    
    console.log('✅ Order created successfully!');
    console.log('   Order ID:', order.order_id);
    console.log('   Coupon Code:', order.coupon_code);
    console.log('   Amount:', order.order_amount);
    console.log('');
    
    // 3. Clean up test order
    console.log('3️⃣ Cleaning up test order...');
    const { error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('id', testOrder.id);
    
    if (deleteError) {
      console.warn('⚠️  Could not delete test order:', deleteError.message);
    } else {
      console.log('✅ Test order cleaned up\n');
    }
    
    // 4. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. ✅ Migration applied successfully');
    console.log('   2. ✅ coupon_code column is working');
    console.log('   3. 🔄 Restart your API server');
    console.log('   4. 🧪 Test order placement in ChopChop');
    console.log('');
    console.log('🎉 Order placement should now work!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testOrderPlacement();
