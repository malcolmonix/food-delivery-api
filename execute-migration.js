/**
 * Execute Migration Directly
 * Executes SQL migration using Supabase's raw SQL execution
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const filename = process.argv[2] || '001_add_state_columns.sql';

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Convert SQLite SQL to PostgreSQL SQL
const convertSqlToPostgres = (sql) => {
  let converted = sql;
  
  // Replace INTEGER with BOOLEAN for boolean fields
  converted = converted.replace(/surgePricing INTEGER DEFAULT 0/g, 'surgePricing BOOLEAN DEFAULT FALSE');
  converted = converted.replace(/isActive INTEGER DEFAULT 1/g, 'isActive BOOLEAN DEFAULT TRUE');
  
  // Replace TEXT DEFAULT CURRENT_TIMESTAMP with TIMESTAMP
  converted = converted.replace(/createdAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  converted = converted.replace(/updatedAt TEXT DEFAULT CURRENT_TIMESTAMP/g, 'updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  
  // Replace REAL with NUMERIC for decimal fields
  converted = converted.replace(/REAL/g, 'NUMERIC');
  
  // Fix the INSERT statement - change 1 to TRUE for boolean
  converted = converted.replace(/VALUES \('default-rate', NULL, 2000, 1\)/g, "VALUES ('default-rate', NULL, 2000, TRUE)");
  
  return converted;
};

async function executeMigration() {
  try {
    console.log('\n🔄 Executing migration...\n');
    
    // Read migration file
    const filePath = path.join(MIGRATIONS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filename}`);
    }
    
    let sql = fs.readFileSync(filePath, 'utf8');
    sql = convertSqlToPostgres(sql);
    
    console.log('📝 Migration SQL:');
    console.log('---');
    console.log(sql);
    console.log('---\n');
    
    // First, ensure migrations table exists
    console.log('1️⃣ Creating migrations table...');
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSql });
    if (tableError) {
      console.log('⚠️ Could not create migrations table via RPC (this is expected)');
      console.log('   Attempting to check if table exists...');
      
      // Try to query the table to see if it exists
      const { error: checkError } = await supabase.from('migrations').select('filename').limit(1);
      if (checkError && checkError.code === 'PGRST205') {
        console.log('\n❌ Migrations table does not exist!');
        console.log('Please create it manually in Supabase SQL Editor:');
        console.log(createTableSql);
        console.log('\nThen run this script again.');
        process.exit(1);
      }
    }
    console.log('✓ Migrations table ready\n');
    
    // Check if migration already applied
    console.log('2️⃣ Checking if migration already applied...');
    const { data: existing } = await supabase
      .from('migrations')
      .select('filename')
      .eq('filename', filename)
      .single();
    
    if (existing) {
      console.log('✓ Migration already applied, skipping\n');
      return;
    }
    console.log('✓ Migration not yet applied\n');
    
    // Execute migration statements one by one
    console.log('3️⃣ Executing migration statements...\n');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} statements to execute\n`);
    
    // Since Supabase client doesn't support DDL directly, we'll provide clear instructions
    console.log('⚠️ IMPORTANT: Supabase client cannot execute DDL statements directly.');
    console.log('Please execute the following SQL in Supabase SQL Editor:\n');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    console.log('\nAfter executing in Supabase, run:');
    console.log(`  node mark-migration-applied.js ${filename}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

executeMigration();
