/**
 * Apply Supabase Schema
 * Runs the schema SQL file against Supabase database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  try {
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Applying schema to Supabase...');
    console.log(`📍 Database: ${supabaseUrl}`);

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;

      try {
        console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
        
        // Execute via Supabase RPC or direct SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // If RPC doesn't exist, try alternative method
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.warn('⚠️  RPC method not available, using alternative approach');
            // For now, log the statement that needs manual execution
            console.log('📝 Statement needs manual execution:');
            console.log(statement.substring(0, 100) + '...');
            errorCount++;
          } else {
            throw error;
          }
        } else {
          console.log('✅ Success');
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        console.error('Statement:', statement.substring(0, 200));
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Schema Application Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. You may need to:');
      console.log('1. Run the schema manually via Supabase SQL Editor');
      console.log('2. Check for existing tables/policies');
      console.log('3. Verify service role permissions');
    } else {
      console.log('\n🎉 Schema applied successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Alternative: Direct PostgreSQL connection method
async function applySchemaDirectly() {
  console.log('\n📋 Alternative Method: Manual Schema Application');
  console.log('='.repeat(60));
  console.log('Since Supabase JS client has limitations for DDL operations,');
  console.log('please apply the schema manually using one of these methods:\n');
  
  console.log('Method 1: Supabase Dashboard');
  console.log('1. Go to: ' + supabaseUrl.replace('/rest/v1', '') + '/project/_/sql');
  console.log('2. Copy contents of: api/supabase-schema.sql');
  console.log('3. Paste and run in SQL Editor\n');
  
  console.log('Method 2: psql Command Line');
  console.log('psql $DATABASE_URL -f api/supabase-schema.sql\n');
  
  console.log('Method 3: Node.js with pg library');
  console.log('npm install pg');
  console.log('node api/run-migrations-postgres.js\n');
  
  console.log('='.repeat(60));
}

// Run the schema application
console.log('🚀 Supabase Schema Application Tool');
console.log('='.repeat(60));

applySchemaDirectly();

console.log('\n💡 Tip: For production, use Supabase migrations:');
console.log('   supabase db push');
console.log('   supabase db reset');
