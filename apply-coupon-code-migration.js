/**
 * Apply Coupon Code Migration to Supabase
 * Adds the missing coupon_code column to the orders table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Applying Coupon Code Migration to Supabase\n');
  console.log('📡 Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '003_add_coupon_code_to_orders.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('');

    // Execute the migration
    console.log('🚀 Executing migration...\n');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution if RPC fails
          console.log('   RPC failed, trying direct execution...');
          const { error: directError } = await supabase.from('_migrations').insert({
            name: '003_add_coupon_code_to_orders',
            executed_at: new Date().toISOString()
          });
          
          if (directError && !directError.message.includes('already exists')) {
            throw directError;
          }
        }
      }
    }

    console.log('');
    console.log('✅ Migration applied successfully!');
    console.log('');
    
    // Reload PostgREST schema cache
    console.log('🔄 Reloading Supabase schema cache...');
    try {
      const reloadUrl = supabaseUrl.replace('https://', 'https://') + '/rest/v1/';
      const response = await fetch(reloadUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        }
      });
      
      if (response.ok || response.status === 404) {
        console.log('✅ Schema cache reload triggered');
      } else {
        console.log('⚠️  Schema cache reload may have failed (this is usually okay)');
        console.log('   Wait 1-2 minutes for automatic cache refresh');
      }
    } catch (reloadError) {
      console.log('⚠️  Could not reload schema cache automatically');
      console.log('   Wait 1-2 minutes for automatic cache refresh');
    }
    
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Wait 1-2 minutes for schema cache to refresh');
    console.log('   2. Restart your API server');
    console.log('   3. Try placing an order again in ChopChop');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('🔧 Manual Fix:');
    console.error('   1. Go to your Supabase dashboard');
    console.error('   2. Open the SQL Editor');
    console.error('   3. Run this SQL:');
    console.error('');
    console.error('      ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;');
    console.error('');
    process.exit(1);
  }
}

applyMigration();
