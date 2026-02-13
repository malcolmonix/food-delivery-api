/**
 * Apply user_type column migration to Supabase
 * Run: node apply-user-type-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { supabase } = require('./supabase');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('\n🚀 Applying user_type Column Migration\n');
  console.log('='.repeat(60));
  
  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'migrations', 'add_user_type_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\n📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(60));
    
    // Execute the migration
    console.log('\n⚡ Executing migration...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      // If exec_sql doesn't exist, we need to apply it manually
      console.log('⚠️  Cannot execute SQL directly via Supabase client');
      console.log('\n📝 Manual Steps Required:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:\n');
      console.log(migrationSQL);
      console.log('\n4. Then run: node fix-rider-user-types-simple.js');
      console.log('');
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the column exists
    console.log('\n🔍 Verifying column...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('uid, user_type')
      .limit(1);
    
    if (testError) {
      console.error('❌ Verification failed:', testError.message);
    } else {
      console.log('✅ Column verified successfully!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Migration Complete\n');
    console.log('Next steps:');
    console.log('1. Run: node fix-rider-user-types-simple.js');
    console.log('2. Identify rider UIDs and add them to the script');
    console.log('3. Run the script again to update rider user_types');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
    console.error(error.stack);
  }
}

applyMigration();
