/**
 * Verify Migration Script
 * Checks if database migrations were applied successfully
 */

require('dotenv').config();
const { supabase } = require('./supabase');

async function verifyMigration() {
  console.log('\n🔍 Verifying database migration...\n');
  
  const results = {
    migrationsTable: false,
    restaurantsStateColumn: false,
    usersStateColumn: false,
    deliveryRatesTable: false,
    defaultDeliveryRate: false,
    indexes: {
      restaurants_state: false,
      restaurants_state_cuisine: false,
      delivery_rates_state: false,
      delivery_rates_distance: false
    }
  };
  
  try {
    // 1. Check migrations table exists
    console.log('1️⃣ Checking migrations table...');
    const { data: migrations, error: migrationsError } = await supabase
      .from('migrations')
      .select('*');
    
    if (!migrationsError) {
      results.migrationsTable = true;
      console.log('   ✓ Migrations table exists');
      if (migrations && migrations.length > 0) {
        console.log(`   ✓ Found ${migrations.length} applied migration(s):`);
        migrations.forEach(m => console.log(`     - ${m.filename} (${m.applied_at})`));
      }
    } else {
      console.log('   ❌ Migrations table not found');
      console.log('   Error:', migrationsError.message);
    }
    
    // 2. Check restaurants table has state column
    console.log('\n2️⃣ Checking restaurants table...');
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, state')
      .limit(1);
    
    if (!restaurantsError) {
      results.restaurantsStateColumn = true;
      console.log('   ✓ Restaurants table has state column');
    } else {
      console.log('   ❌ State column not found in restaurants table');
      console.log('   Error:', restaurantsError.message);
    }
    
    // 3. Check users table has state column
    console.log('\n3️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, state')
      .limit(1);
    
    if (!usersError) {
      results.usersStateColumn = true;
      console.log('   ✓ Users table has state column');
    } else {
      console.log('   ❌ State column not found in users table');
      console.log('   Error:', usersError.message);
    }
    
    // 4. Check delivery_rates table exists
    console.log('\n4️⃣ Checking delivery_rates table...');
    const { data: deliveryRates, error: deliveryRatesError } = await supabase
      .from('delivery_rates')
      .select('*');
    
    if (!deliveryRatesError) {
      results.deliveryRatesTable = true;
      console.log('   ✓ Delivery_rates table exists');
      
      if (deliveryRates && deliveryRates.length > 0) {
        console.log(`   ✓ Found ${deliveryRates.length} delivery rate(s)`);
        
        // Check for default rate
        const defaultRate = deliveryRates.find(r => r.id === 'default-rate');
        if (defaultRate) {
          results.defaultDeliveryRate = true;
          console.log('   ✓ Default delivery rate found:');
          console.log(`     - ID: ${defaultRate.id}`);
          console.log(`     - Base Fee: ₦${defaultRate.baseFee}`);
          console.log(`     - State: ${defaultRate.state || 'NULL (applies to all states)'}`);
          console.log(`     - Active: ${defaultRate.isActive}`);
        } else {
          console.log('   ❌ Default delivery rate not found');
        }
      } else {
        console.log('   ⚠️ No delivery rates found in table');
      }
    } else {
      console.log('   ❌ Delivery_rates table not found');
      console.log('   Error:', deliveryRatesError.message);
    }
    
    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const checks = [
      { name: 'Migrations table', status: results.migrationsTable },
      { name: 'Restaurants state column', status: results.restaurantsStateColumn },
      { name: 'Users state column', status: results.usersStateColumn },
      { name: 'Delivery_rates table', status: results.deliveryRatesTable },
      { name: 'Default delivery rate', status: results.defaultDeliveryRate }
    ];
    
    checks.forEach(check => {
      const icon = check.status ? '✓' : '❌';
      console.log(`${icon} ${check.name}`);
    });
    
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status).length;
    const percentage = Math.round((passedChecks / totalChecks) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log(`Result: ${passedChecks}/${totalChecks} checks passed (${percentage}%)`);
    console.log('='.repeat(60));
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 All migrations applied successfully!\n');
      return true;
    } else {
      console.log('\n⚠️ Some migrations are missing. Please run the migration SQL in Supabase.\n');
      console.log('See MIGRATION_INSTRUCTIONS.md for detailed steps.\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifyMigration().then(success => {
  process.exit(success ? 0 : 1);
});
