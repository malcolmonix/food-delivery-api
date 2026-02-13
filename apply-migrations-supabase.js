/**
 * Apply Migrations to Supabase
 * This script applies SQL migrations directly to Supabase using the service role key
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Convert SQLite SQL to PostgreSQL SQL
const convertSqlToPostgres = (sql) => {
  let converted = sql;
  
  // Replace INTEGER with BOOLEAN for boolean fields
  converted = converted.replace(/surgePricing INTEGER DEFAULT 0/g, 'surgePricing BOOLEAN DEFAULT FALSE');
  converted = converted.replace(/isActive INTEGER DEFAULT 1/g, 'isActive BOOLEAN DEFAULT TRUE');
  
  // Replace TEXT DEFAULT CURRENT_TIMESTAMP with TIMESTAMP
  converted = converted.replace(/createdAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  converted = converted.replace(/updatedAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  converted = converted.replace(/appliedAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  
  // Replace REAL with NUMERIC for decimal fields
  converted = converted.replace(/REAL/g, 'NUMERIC');
  
  // Handle ON CONFLICT for PostgreSQL
  converted = converted.replace(/ON CONFLICT\(id\) DO NOTHING/g, 'ON CONFLICT (id) DO NOTHING');
  
  // Fix column names to match Supabase schema (snake_case)
  converted = converted.replace(/isActive/g, 'is_active');
  converted = converted.replace(/cuisineType/g, 'cuisine');
  converted = converted.replace(/isOnline/g, 'is_online');
  converted = converted.replace(/isBusy/g, 'is_busy');
  converted = converted.replace(/minDistance/g, 'min_distance');
  converted = converted.replace(/maxDistance/g, 'max_distance');
  converted = converted.replace(/baseFee/g, 'base_fee');
  converted = converted.replace(/perKmFee/g, 'per_km_fee');
  converted = converted.replace(/surgePricing/g, 'surge_pricing');
  converted = converted.replace(/surgeMultiplier/g, 'surge_multiplier');
  converted = converted.replace(/createdAt/g, 'created_at');
  converted = converted.replace(/updatedAt/g, 'updated_at');
  
  return converted;
};

// Execute SQL using Supabase RPC
const executeSql = async (sql) => {
  try {
    // Use the REST API to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Get applied migrations
const getAppliedMigrations = async () => {
  try {
    const { data, error } = await supabase
      .from('migrations')
      .select('filename');

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('not find the table')) {
        return [];
      }
      throw error;
    }

    return data.map(row => row.filename);
  } catch (error) {
    return [];
  }
};

// Record migration as applied
const recordMigration = async (filename) => {
  const { error } = await supabase
    .from('migrations')
    .insert({ filename });

  if (error) {
    throw error;
  }
};

// Apply a single migration
const applyMigration = async (filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  let sql = fs.readFileSync(filePath, 'utf8');
  
  // Convert SQLite syntax to PostgreSQL
  sql = convertSqlToPostgres(sql);
  
  console.log(`\n📝 Applying migration: ${filename}`);
  console.log('---');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statement(s)\n`);
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      // For Supabase, we need to use the SQL editor or direct database connection
      // Since we can't execute DDL through the REST API, we'll provide instructions
      console.log('Statement preview:', statement.substring(0, 80) + '...');
      
      // Try to execute using the supabase client
      // Note: This may not work for all DDL statements
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.log(`⚠️ Could not execute via RPC: ${error.message}`);
        console.log('This statement needs to be executed manually in Supabase SQL Editor');
      } else {
        console.log('✓ Statement executed successfully');
      }
      
    } catch (error) {
      console.error(`❌ Error executing statement ${i + 1}:`, error.message);
      throw error;
    }
  }
  
  // Record migration as applied
  await recordMigration(filename);
  console.log(`✓ Migration ${filename} recorded as applied`);
};

// Main function
const main = async () => {
  try {
    console.log('\n🔄 Starting Supabase migration application...\n');
    console.log('URL:', supabaseUrl);
    console.log();
    
    // Get list of migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration file(s):\n`);
    migrationFiles.forEach(file => console.log(`  - ${file}`));
    console.log();
    
    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`Already applied: ${appliedMigrations.length} migration(s)\n`);
    
    // Get pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ All migrations are up to date.\n');
      return;
    }
    
    console.log(`⚠️ IMPORTANT: Manual Migration Required!\n`);
    console.log(`Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach(file => console.log(`  - ${file}`));
    console.log();
    
    console.log('📋 To apply these migrations:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL below for each migration');
    console.log('4. Execute each migration in order\n');
    console.log('='.repeat(60));
    
    // Display each migration
    for (const filename of pendingMigrations) {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      let sql = fs.readFileSync(filePath, 'utf8');
      sql = convertSqlToPostgres(sql);
      
      console.log(`\n-- Migration: ${filename}`);
      console.log('-- ' + '='.repeat(56));
      console.log(sql);
      console.log('-- ' + '='.repeat(56));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ After running the migrations in Supabase SQL Editor:');
    console.log('   Run: node verify-migration.js');
    console.log('   To verify the migrations were applied correctly\n');
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

// Run main function
main();
