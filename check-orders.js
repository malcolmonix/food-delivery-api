// Check orders in both Supabase and Firestore
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { admin } = require('./firebase');

async function checkOrders() {
    console.log('🔍 Checking Orders in Database\n');
    console.log('='.repeat(80));
    
    try {
        // Check Supabase
        console.log('\n📊 SUPABASE ORDERS:');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        const { data: supabaseOrders, error: supabaseError } = await supabase
            .from('orders')
            .select('id, order_id, user_id, order_status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (supabaseError) {
            console.error('❌ Supabase error:', supabaseError);
        } else if (!supabaseOrders || supabaseOrders.length === 0) {
            console.log('⚠️  No orders found in Supabase');
        } else {
            console.log(`✅ Found ${supabaseOrders.length} orders in Supabase:`);
            supabaseOrders.forEach((order, index) => {
                console.log(`  ${index + 1}. Order ID: ${order.order_id}`);
                console.log(`     User ID: ${order.user_id}`);
                console.log(`     Status: ${order.order_status}`);
                console.log(`     Created: ${order.created_at}`);
                console.log('');
            });
        }
        
        // Check Firestore
        console.log('\n🔥 FIRESTORE ORDERS:');
        const db = admin.firestore();
        const firestoreSnapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        if (firestoreSnapshot.empty) {
            console.log('⚠️  No orders found in Firestore');
        } else {
            console.log(`✅ Found ${firestoreSnapshot.size} orders in Firestore:`);
            firestoreSnapshot.forEach((doc, index) => {
                const order = doc.data();
                console.log(`  ${index + 1}. Order ID: ${order.orderId || doc.id}`);
                console.log(`     User ID: ${order.userId || order.user}`);
                console.log(`     Status: ${order.orderStatus || order.status}`);
                console.log(`     Created: ${order.createdAt || 'N/A'}`);
                console.log('');
            });
        }
        
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('\n❌ Error checking orders:', error);
        console.error('Error details:', error.message);
    }
}

checkOrders().then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
}).catch(err => {
    console.error('\n❌ Check failed:', err);
    process.exit(1);
});
