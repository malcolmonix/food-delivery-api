require('dotenv').config();
const { supabase } = require('./supabase');

async function testConnection() {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing');
    console.log('Key:', (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) ? '✅ Present' : '❌ Missing');

    try {
        const { data, error, status } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
            console.error('Status:', status);
        } else {
            console.log('✅ Supabase connection successful!');
            console.log(`Total users in database: ${data || 0}`);
        }
    } catch (err) {
        console.error('❌ Unexpected error during connection test:', err.message);
    }
}

testConnection().then(() => process.exit());
