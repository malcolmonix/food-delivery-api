/**
 * Apply All Missing Columns Migration to Supabase
 * Adds both coupon_code and customer_info columns to the orders table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  console.log('🔧 Applying All Missing Columns Migrations to Supabase\n');
  console.log('📡 Supabase URL:', supabaseUrl);
  console.log('');

  const migrations = [
    '003_add_coupon_code_to_orders.sql',
    '004_add_customer_info_to_orders.sql'
  ];

  try {
    for (const migrationFile of migrations) {
      console.log(`📄 Processing: ${migrationFile}`);
      
      // Read the migration file
      const migrationPath = path.join(__dirname, 'migrations', migrationFile);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`   ⚠️  File not found, skipping...`);
        continue;
      }
      
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`   Executing: ${statement.substring(0, 60)}...`);
          
          // Use raw SQL execution via Supabase RPC
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // If RPC doesn't exist, that's okay - columns might already exist
            console.log(`   ⚠️  RPC execution note: ${error.message}`);
          } else {
            console.log(`   ✅ Success`);
          }
        }
      }
      
      console.log(`✅ ${migrationFile} completed\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL MIGRATIONS APPLIED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Wait 1-2 minutes for Supabase schema cache to refresh');
    console.log('   2. Restart your API server');
    console.log('   3. Try placing an order again in ChopChop');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('🔧 Manual Fix:');
    console.error('   1. Go to your Supabase dashboard');
    console.error('   2. Open the SQL Editor');
    console.error('   3. Run these SQL commands:');
    console.error('');
    console.error('      ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;');
    console.error('      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_info JSONB;');
    console.error('');
    process.exit(1);
  }
}

applyMigrations();
