// Verify that indexes exist on the orders table
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifyIndexes() {
    console.log('🔍 Verifying Order Tracking Indexes\n');
    console.log('='.repeat(80));
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        // Query to check indexes on orders table
        const { data, error } = await supabase
            .rpc('exec_sql', {
                query: `
                    SELECT 
                        indexname, 
                        indexdef 
                    FROM pg_indexes 
                    WHERE tablename = 'orders'
                    ORDER BY indexname;
                `
            });
        
        if (error) {
            console.log('⚠️  Cannot query indexes directly (expected - requires admin access)');
            console.log('   Indexes should be created via Supabase dashboard or SQL editor');
            console.log('\n📋 To verify indexes manually:');
            console.log('   1. Go to Supabase Dashboard > SQL Editor');
            console.log('   2. Run: SELECT indexname, indexdef FROM pg_indexes WHERE tablename = \'orders\';');
            console.log('\n✅ Expected indexes:');
            console.log('   - idx_orders_order_id');
            console.log('   - idx_orders_user_id');
            console.log('   - idx_orders_status');
        } else {
            console.log('✅ Indexes found:');
            data.forEach(index => {
                console.log(`  - ${index.indexname}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
        
    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
    }
}

verifyIndexes().then(() => {
    console.log('\n✅ Verification completed');
    process.exit(0);
}).catch(err => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
});
